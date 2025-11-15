from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import get_db
from app.models import User, Assignment, Submission, SubmissionStatus
from app.schemas import SubmissionResponse, SubmissionDetail
from app.core.security import get_current_user
from app.core.gemini_client import grade_homework, extract_json_from_report
from app.core.json_processor import process_report_to_json, parse_name_id_from_filename
from typing import List
import os

router = APIRouter()

UPLOAD_DIR = Path("uploads")
SUBMISSIONS_DIR = UPLOAD_DIR / "submissions"
SUBMISSIONS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/assignments/{assignment_id}/submit")
async def submit_homework(
    assignment_id: int,
    homework_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """学生提交作业"""
    if current_user.role.value != "student":
        raise HTTPException(status_code=403, detail="只有学生可以提交作业")
    
    # 检查作业是否存在且已发布
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.class_id != current_user.class_id:
        raise HTTPException(status_code=403, detail="无权提交此作业")
    if assignment.status.value != "published":
        raise HTTPException(status_code=400, detail="作业未发布")
    
    # 检查是否已提交
    existing = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="已提交过此作业")
    
    # 检查文件格式
    if not homework_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="仅支持PDF格式")
    
    # 保存作业文件（目录结构：班级ID/作业ID/学号-学生姓名）
    # 结构：uploads/submissions/{class_id}/{assignment_id}/{student_id}-{student_name}/
    # 学生必须有学号
    if not current_user.student_id:
        raise HTTPException(status_code=400, detail="学生必须设置学号才能提交作业")
    
    class_id = assignment.class_id
    student_folder = f"{current_user.student_id}-{current_user.username}"
    submission_dir = SUBMISSIONS_DIR / class_id / str(assignment_id) / student_folder
    submission_dir.mkdir(parents=True, exist_ok=True)
    
    # 构建文件名：学号-姓名-作业.pdf
    filename = f"{current_user.student_id}-{current_user.username}-homework.pdf"
    homework_path = submission_dir / filename
    
    with open(homework_path, "wb") as f:
        content = await homework_file.read()
        f.write(content)
    
    # 创建提交记录
    submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        homework_file_path=str(homework_path),
        status=SubmissionStatus.PENDING
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # 异步批改（这里简化处理，实际应该用后台任务）
    try:
        # 获取标准答案文件
        answer_path = Path(assignment.answer_file_path)
        if not answer_path.exists():
            raise HTTPException(status_code=500, detail="标准答案文件不存在")
        
        # 调用批改API
        report_md = grade_homework(homework_path, answer_path)
        
        # 保存报告（文件名包含学号和姓名，学生必须有学号）
        if not current_user.student_id:
            raise HTTPException(status_code=500, detail="学生学号未设置")
        
        report_filename = f"{current_user.student_id}-{current_user.username}-report.md"
        json_filename = f"{current_user.student_id}-{current_user.username}-data.json"
        
        report_path = submission_dir / report_filename
        report_path.write_text(report_md, encoding="utf-8")
        
        # 提取JSON数据
        raw_json = extract_json_from_report(report_md)
        # 使用数据库中的学号和姓名
        student_name = current_user.username
        student_id = current_user.student_id
        
        json_data = process_report_to_json(
            report_md, student_name, student_id, raw_json.get("questions", [])
        )
        
        # 保存JSON
        json_path = submission_dir / json_filename
        import json
        json_path.write_text(
            json.dumps(json_data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        
        # 更新提交记录
        submission.report_file_path = str(report_path)
        submission.json_file_path = str(json_path)
        submission.status = SubmissionStatus.GRADED
        submission.grade = json_data.get("grade")
        db.commit()
        
        return {
            "success": True,
            "submission": SubmissionResponse.from_orm(submission),
            "message": "作业提交成功，批改完成"
        }
    except Exception as e:
        # 批改失败，但提交记录已保存
        raise HTTPException(status_code=500, detail=f"批改失败: {str(e)}")

@router.get("/assignments/{assignment_id}/submission", response_model=SubmissionResponse)
async def get_my_submission(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的提交记录"""
    if current_user.role.value != "student":
        raise HTTPException(status_code=403, detail="只有学生可以查看提交")
    
    submission = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="未找到提交记录")
    
    return submission

@router.get("/assignments/{assignment_id}/report")
async def get_my_report(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的批改报告"""
    if current_user.role.value != "student":
        raise HTTPException(status_code=403, detail="只有学生可以查看报告")
    
    submission = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="未找到提交记录")
    
    if submission.status.value != "published":
        raise HTTPException(status_code=403, detail="报告尚未发布")
    
    if not submission.report_file_path:
        raise HTTPException(status_code=404, detail="报告文件不存在")
    
    report_path = Path(submission.report_file_path)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="报告文件不存在")
    
    return {
        "content": report_path.read_text(encoding="utf-8"),
        "grade": submission.grade
    }

@router.get("/my-submissions", response_model=List[SubmissionResponse])
async def list_my_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的所有提交"""
    if current_user.role.value != "student":
        raise HTTPException(status_code=403, detail="只有学生可以查看提交")
    
    submissions = db.query(Submission).filter(
        Submission.student_id == current_user.id
    ).all()
    
    return submissions

