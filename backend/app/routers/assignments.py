from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import os
from app.database import get_db
from app.models import User, Assignment, AssignmentStatus
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentDetail, AnswerUpdate
from app.core.security import get_current_user
from app.core.gemini_client import extract_qa_from_pdf
from typing import List, Optional

router = APIRouter()

# 文件存储目录
UPLOAD_DIR = Path("uploads")
TEACHERS_DIR = UPLOAD_DIR / "teachers"

def get_teacher_assignment_dir(teacher: "User", assignment: "Assignment") -> Path:
    """获取教师作业目录：uploads/teachers/{teacher_name}_{teacher_id}/assignments/{assignment_title}_{assignment_id}/"""
    from app.core.file_utils import get_teacher_dir_name, get_assignment_dir_name
    teacher_dir = get_teacher_dir_name(teacher.username, teacher.id)
    assignment_dir = get_assignment_dir_name(assignment.title, assignment.id)
    return TEACHERS_DIR / teacher_dir / "assignments" / assignment_dir

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建作业（仅创建记录，不包含答案）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以创建作业")
    
    assignment = Assignment(
        title=assignment_data.title,
        teacher_id=current_user.id,
        class_id=assignment_data.class_id,
        status=AssignmentStatus.DRAFT
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/{assignment_id}/extract-answer")
async def extract_answer(
    assignment_id: int,
    pdf_file: UploadFile = File(...),
    teacher_msg: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从PDF提取答案"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以提取答案")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 保存PDF文件（保存到教师作业目录的source子目录）
    assignment_dir = get_teacher_assignment_dir(current_user, assignment)
    source_dir = assignment_dir / "source"
    source_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = source_dir / f"source_{pdf_file.filename}"
    
    with open(pdf_path, "wb") as f:
        content = await pdf_file.read()
        f.write(content)
    
    if not teacher_msg:
        raise HTTPException(status_code=400, detail="请提供题目选择说明")
    
    # 调用Gemini API提取答案
    try:
        answer_md = extract_qa_from_pdf(pdf_path, teacher_msg)
        
        # 保存答案文件
        answer_path = assignment_dir / "answer_selected.md"
        answer_path.write_text(answer_md, encoding="utf-8")
        
        # 更新作业记录
        assignment.answer_file_path = str(answer_path)
        assignment.answer_content = answer_md
        db.commit()
        
        return {
            "success": True,
            "answer_content": answer_md,
            "message": "题目和答案提取成功"
        }
    except ValueError as e:
        # ValueError通常是业务逻辑错误，直接返回友好提示
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 其他异常，提供更详细的错误信息
        error_msg = str(e)
        if "503" in error_msg or "overloaded" in error_msg.lower() or "UNAVAILABLE" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Gemini API当前过载，请稍后重试。如果问题持续，可能是API配额已用完或服务暂时不可用。"
            )
        raise HTTPException(status_code=500, detail=f"提取答案失败: {error_msg}")

@router.put("/{assignment_id}/answer")
async def update_answer(
    assignment_id: int,
    answer_data: AnswerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新答案内容（教师校对后）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以更新答案")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    try:
        assignment.answer_content = answer_data.answer_content
        # 确保答案文件路径存在（保存到教师作业目录）
        assignment_dir = get_teacher_assignment_dir(current_user, assignment)
        assignment_dir.mkdir(parents=True, exist_ok=True)
        answer_path = assignment_dir / "answer_selected.md"
        assignment.answer_file_path = str(answer_path)
        
        # 保存到文件
        answer_path.write_text(answer_data.answer_content, encoding="utf-8")
        
        db.commit()
        db.refresh(assignment)
        
        return {
            "success": True,
            "message": "答案已更新",
            "assignment_id": assignment.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存答案失败: {str(e)}")

@router.put("/{assignment_id}")
async def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新作业信息（仅限草稿状态）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以更新作业")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    if assignment.status != AssignmentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只能编辑草稿状态的作业")
    
    # 更新字段
    if assignment_data.title is not None:
        assignment.title = assignment_data.title
    if assignment_data.deadline is not None:
        assignment.deadline = assignment_data.deadline
    if assignment_data.answer_content is not None:
        assignment.answer_content = assignment_data.answer_content
        # 确保答案文件路径存在（保存到教师作业目录）
        assignment_dir = get_teacher_assignment_dir(current_user, assignment)
        assignment_dir.mkdir(parents=True, exist_ok=True)
        answer_path = assignment_dir / "answer_selected.md"
        assignment.answer_file_path = str(answer_path)
        
        # 保存到文件
        answer_path.write_text(assignment_data.answer_content, encoding="utf-8")
    
    db.commit()
    db.refresh(assignment)
    
    return {"success": True, "message": "作业已更新", "assignment": assignment}

@router.post("/{assignment_id}/publish")
async def publish_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发布作业"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以发布作业")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    if not assignment.answer_content:
        raise HTTPException(status_code=400, detail="请先提取并确认答案")
    
    assignment.status = AssignmentStatus.PUBLISHED
    db.commit()
    
    return {"success": True, "message": "作业已发布"}

@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取作业列表"""
    if current_user.role.value == "teacher":
        # 教师查看自己创建的作业
        assignments = db.query(Assignment).filter(
            Assignment.teacher_id == current_user.id
        ).all()
    else:
        # 学生查看自己班级的作业
        assignments = db.query(Assignment).filter(
            Assignment.class_id == current_user.class_id,
            Assignment.status == AssignmentStatus.PUBLISHED
        ).all()
    
    return assignments

@router.get("/{assignment_id}", response_model=AssignmentDetail)
async def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取作业详情"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    
    # 权限检查
    if current_user.role.value == "teacher":
        if assignment.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问此作业")
    else:
        if assignment.class_id != current_user.class_id:
            raise HTTPException(status_code=403, detail="无权访问此作业")
        if assignment.status != AssignmentStatus.PUBLISHED:
            raise HTTPException(status_code=403, detail="作业未发布")
    
    return assignment

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除作业（仅限草稿状态）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以删除作业")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此作业")
    
    # 只允许删除草稿状态的作业
    if assignment.status != AssignmentStatus.DRAFT:
        raise HTTPException(
            status_code=400, 
            detail=f"只能删除草稿状态的作业，当前状态为：{assignment.status.value}"
        )
    
    # 检查是否有学生提交（虽然草稿状态学生看不到，但为了安全起见还是检查一下）
    from app.models import Submission
    submission_count = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).count()
    
    if submission_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"该作业已有 {submission_count} 份提交，无法删除"
        )
    
    try:
        # 删除作业相关的文件
        assignment_dir = get_teacher_assignment_dir(current_user, assignment)
        if assignment_dir.exists():
            import shutil
            shutil.rmtree(assignment_dir)
        
        # 删除数据库记录
        db.delete(assignment)
        db.commit()
        
        return {
            "success": True,
            "message": "作业已删除"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除作业失败: {str(e)}")

