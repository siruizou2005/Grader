from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import get_db
from app.models import User, Assignment, Submission, SubmissionStatus, UserRole
from app.schemas import AssignmentStats, SubmissionDetail
from app.core.security import get_current_user
from app.core.excel_generator import generate_excel
from app.core.gemini_client import generate_class_report
from app.core.file_utils import get_teacher_dir_name, get_assignment_dir_name
from typing import List
import json
from collections import defaultdict

router = APIRouter()

UPLOAD_DIR = Path("uploads")
SUBMISSIONS_DIR = UPLOAD_DIR / "submissions"
TEACHERS_DIR = UPLOAD_DIR / "teachers"

def get_teacher_assignment_dir(teacher: User, assignment: Assignment) -> Path:
    """获取教师作业目录：uploads/teachers/{teacher_name}_{teacher_id}/assignments/{assignment_title}_{assignment_id}/"""
    teacher_dir = get_teacher_dir_name(teacher.username, teacher.id)
    assignment_dir = get_assignment_dir_name(assignment.title, assignment.id)
    return TEACHERS_DIR / teacher_dir / "assignments" / assignment_dir

@router.get("/assignments/{assignment_id}/stats", response_model=AssignmentStats)
async def get_assignment_stats(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取作业学情统计"""
    try:
        if current_user.role.value != "teacher":
            raise HTTPException(status_code=403, detail="只有教师可以查看统计")
        
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="作业不存在")
        if assignment.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问此作业")
        
        # 获取所有提交
        submissions = db.query(Submission).filter(
            Submission.assignment_id == assignment_id
        ).all()
        
        # 统计基本信息
        total_students = len(db.query(User).filter(
            User.class_id == assignment.class_id,
            User.role == UserRole.STUDENT
        ).all())
        submitted_count = len(submissions)
        submission_rate = (submitted_count / total_students * 100) if total_students > 0 else 0
        
        # 统计等级分布
        grade_distribution = defaultdict(int)
        question_stats = defaultdict(lambda: {"correct": 0, "partial": 0, "wrong": 0, "total": 0})
        low_score_students = []
        
        total_grade_points = 0
        grade_count = 0
        
        for submission in submissions:
            if submission.grade:
                grade_distribution[submission.grade] += 1
                # 计算平均等级（简化处理）
                grade_map = {"A+": 10, "A": 9, "A-": 8, "B+": 7, "B": 6, "B-": 5, 
                            "C+": 4, "C": 3, "C-": 2, "D": 1, "F": 0}
                if submission.grade in grade_map:
                    total_grade_points += grade_map[submission.grade]
                    grade_count += 1
                
                # 判断低分学生
                if submission.grade in ["D", "F", "C-", "C"]:
                    low_score_students.append({
                        "student_id": submission.student.id,
                        "student_name": submission.student.username,
                        "grade": submission.grade
                    })
            
            # 统计题目数据
            if submission.json_file_path:
                json_path = Path(submission.json_file_path)
                if json_path.exists():
                    try:
                        data = json.loads(json_path.read_text(encoding="utf-8"))
                        for q in data.get("questions", []):
                            key = q.get("key", "")
                            status = q.get("status", "")
                            if key:
                                question_stats[key]["total"] += 1
                                if status == "正确":
                                    question_stats[key]["correct"] += 1
                                elif status == "过程部分正确":
                                    question_stats[key]["partial"] += 1
                                else:
                                    question_stats[key]["wrong"] += 1
                    except Exception as e:
                        import traceback
                        print(f"解析JSON文件失败 {json_path}: {e}")
                        traceback.print_exc()
                        pass
        
        # 计算平均等级
        average_grade = None
        if grade_count > 0:
            avg_point = total_grade_points / grade_count
            grade_map_reverse = {10: "A+", 9: "A", 8: "A-", 7: "B+", 6: "B", 5: "B-",
                                4: "C+", 3: "C", 2: "C-", 1: "D", 0: "F"}
            # 找到最接近的等级
            closest_grade = min(grade_map_reverse.keys(), key=lambda x: abs(x - avg_point))
            average_grade = grade_map_reverse[closest_grade]
        
        # 转换为列表格式
        question_stats_list = [
            {
                "key": key,
                "correct_count": stats["correct"],
                "partial_count": stats["partial"],
                "wrong_count": stats["wrong"],
                "total_count": stats["total"]
            }
            for key, stats in question_stats.items()
        ]
        
        return {
            "total_students": total_students,
            "submitted_count": submitted_count,
            "submission_rate": round(submission_rate, 2),
            "average_grade": average_grade,
            "grade_distribution": dict(grade_distribution),
            "question_stats": question_stats_list,
            "low_score_students": low_score_students
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"获取统计数据失败: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/assignments/{assignment_id}/submissions", response_model=List[SubmissionDetail])
async def list_submissions(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取作业的所有提交"""
    try:
        if current_user.role.value != "teacher":
            raise HTTPException(status_code=403, detail="只有教师可以查看提交")
        
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="作业不存在")
        if assignment.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问此作业")
        
        submissions = db.query(Submission).filter(
            Submission.assignment_id == assignment_id
        ).all()
        
        result = []
        for sub in submissions:
            try:
                # 手动构建返回数据，确保包含所有必要字段
                result.append({
                    "id": sub.id,
                    "assignment_id": sub.assignment_id,
                    "student_id": sub.student_id,
                    "homework_file_path": sub.homework_file_path or "",
                    "report_file_path": sub.report_file_path or "",
                    "json_file_path": sub.json_file_path or "",
                    "status": sub.status,  # 直接使用枚举对象，Pydantic会自动序列化
                    "grade": sub.grade,
                    "created_at": sub.created_at.isoformat() if sub.created_at else None,
                    "student_name": sub.student.username,
                    "student_id_str": sub.student.student_id or str(sub.student.id)
                })
            except Exception as e:
                import traceback
                error_msg = f"处理提交记录失败 (ID: {sub.id}): {str(e)}"
                print(error_msg)
                traceback.print_exc()
                # 跳过有问题的记录，继续处理其他记录
                continue
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"获取提交列表失败: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/assignments/{assignment_id}/submissions/{submission_id}/homework")
async def get_student_homework(
    assignment_id: int,
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取学生作业原件（PDF）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以查看作业")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="提交不存在")
    if submission.assignment_id != assignment_id:
        raise HTTPException(status_code=400, detail="提交不属于此作业")
    
    if not submission.homework_file_path:
        raise HTTPException(status_code=404, detail="作业文件不存在")
    
    homework_path = Path(submission.homework_file_path)
    if not homework_path.exists():
        raise HTTPException(status_code=404, detail="作业文件不存在")
    
    return FileResponse(
        str(homework_path),
        filename=f"{submission.student.username}_homework.pdf",
        media_type="application/pdf"
    )

@router.get("/assignments/{assignment_id}/submissions/{submission_id}/report")
async def get_student_report(
    assignment_id: int,
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取学生的批改报告"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以查看报告")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="提交不存在")
    if submission.assignment_id != assignment_id:
        raise HTTPException(status_code=400, detail="提交不属于此作业")
    
    if not submission.report_file_path:
        raise HTTPException(status_code=404, detail="报告文件不存在")
    
    report_path = Path(submission.report_file_path)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="报告文件不存在")
    
    return {
        "content": report_path.read_text(encoding="utf-8"),
        "grade": submission.grade,
        "student_name": submission.student.username,
        "student_id": str(submission.student.id)
    }

@router.get("/assignments/{assignment_id}/excel")
async def get_excel_data(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取Excel数据（用于在线查看，直接从JSON生成表格数据）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以查看Excel")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 获取所有提交的JSON文件目录
    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).all()
    
    if not submissions:
        raise HTTPException(status_code=400, detail="没有提交记录")
    
    # 收集所有JSON文件（结构：班级ID/作业ID/学生文件夹）
    json_dir = SUBMISSIONS_DIR / assignment.class_id / str(assignment_id)
    if not json_dir.exists():
        raise HTTPException(status_code=404, detail="数据目录不存在")
    
    try:
        # 直接从JSON文件生成表格数据，不需要生成Excel文件
        from app.core.excel_generator import collect_rows, get_all_qcols
        
        rows = collect_rows(json_dir)
        if not rows:
            raise HTTPException(status_code=400, detail="未找到任何JSON数据")
        
        base_cols = [
            "student_name", "student_id", "total_questions",
            "correct", "partial", "result_wrong", "wrong", "grade"
        ]
        qcols = get_all_qcols(rows)
        
        # 确保所有行都有所有列
        for r in rows:
            for c in qcols:
                r.setdefault(c, "")
        
        # 宽表数据
        wide_data = []
        for r in rows:
            wide_row = {col: r.get(col, "") for col in base_cols + qcols}
            wide_data.append(wide_row)
        
        # 长表数据
        long_data = []
        for r in rows:
            for qc in qcols:
                long_data.append({
                    "student_name": r.get("student_name", ""),
                    "student_id": r.get("student_id", ""),
                    "key": qc[2:] if qc.startswith("Q:") else qc,
                    "status": r.get(qc, ""),
                    "grade": r.get("grade", "")
                })
        
        # 只返回汇总(宽表)数据
        excel_data = {
            "汇总(宽表)": wide_data
        }
        
        return {
            "success": True,
            "data": excel_data,
            "sheets": list(excel_data.keys())
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成表格数据失败: {str(e)}")

@router.get("/assignments/{assignment_id}/download-excel")
async def download_excel(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """下载Excel成绩汇总"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以下载Excel")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 获取所有提交的JSON文件目录
    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).all()
    
    if not submissions:
        raise HTTPException(status_code=400, detail="没有提交记录")
    
    # 收集所有JSON文件（新结构：班级ID/作业ID/学生文件夹）
    json_dir = SUBMISSIONS_DIR / assignment.class_id / str(assignment_id)
    if not json_dir.exists():
        raise HTTPException(status_code=404, detail="数据目录不存在")
    
    # 生成Excel（保存到教师作业目录）
    assignment_dir = get_teacher_assignment_dir(current_user, assignment)
    assignment_dir.mkdir(parents=True, exist_ok=True)
    output_path = assignment_dir / "summary.xlsx"
    try:
        generate_excel(json_dir, output_path)
        return FileResponse(
            str(output_path),
            filename=f"作业分析汇总_{assignment.title}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成Excel失败: {str(e)}")

@router.post("/assignments/{assignment_id}/generate-class-report")
async def generate_class_report_endpoint(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """生成全班学情报告"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以生成报告")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 获取所有已批改的提交
    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.status == SubmissionStatus.GRADED
    ).all()
    
    if not submissions:
        raise HTTPException(status_code=400, detail="没有已批改的提交")
    
    # 汇总所有学生的批改报告（只提取"批改报告"部分）
    combined_content = []
    combined_content.append(f"# 作业：{assignment.title}\n")
    combined_content.append(f"## 全班学生批改报告汇总\n\n")
    
    for idx, submission in enumerate(submissions, 1):
        if not submission.report_file_path:
            continue
        
        report_path = Path(submission.report_file_path)
        if not report_path.exists():
            continue
        
        report_content = report_path.read_text(encoding="utf-8")
        
        # 提取"批改报告"部分（第二部分）
        # 查找"## 二、逐题批改简报"或类似标记
        lines = report_content.split('\n')
        start_idx = -1
        for i, line in enumerate(lines):
            if '##' in line and ('二、' in line or '批改' in line or '简报' in line):
                start_idx = i
                break
        
        if start_idx >= 0:
            # 提取从第二部分开始的内容
            report_section = '\n'.join(lines[start_idx:])
            combined_content.append(f"---\n\n")
            combined_content.append(f"### 学生 {idx}: {submission.student.username} (ID: {submission.student.id})\n\n")
            combined_content.append(report_section)
            combined_content.append("\n\n")
    
    if len(combined_content) <= 2:
        raise HTTPException(status_code=400, detail="没有可用的批改报告")
    
    # 保存汇总的MD文件（保存到教师作业目录）
    assignment_dir = get_teacher_assignment_dir(current_user, assignment)
    assignment_dir.mkdir(parents=True, exist_ok=True)
    combined_md_path = assignment_dir / "combined_reports.md"
    combined_md_path.write_text('\n'.join(combined_content), encoding="utf-8")
    
    # 调用Gemini生成全班学情报告
    try:
        class_report = generate_class_report(combined_md_path)
        
        # 保存全班学情报告（使用时间戳保存历史版本）
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        reports_dir = assignment_dir / "class_reports"
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存带时间戳的报告文件
        class_report_path = reports_dir / f"class_report_{timestamp}.md"
        class_report_path.write_text(class_report, encoding="utf-8")
        
        # 同时保存最新版本（用于快速访问）
        latest_report_path = assignment_dir / "class_report_latest.md"
        latest_report_path.write_text(class_report, encoding="utf-8")
        
        return {
            "success": True,
            "message": "全班学情报告生成成功",
            "report_content": class_report,
            "report_path": str(class_report_path),
            "timestamp": timestamp,
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成报告失败: {str(e)}")

@router.get("/assignments/{assignment_id}/class-reports")
async def list_class_reports(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取所有历史报告列表"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以查看报告")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 使用新的目录结构：teachers/{teacher_name}_{teacher_id}/assignments/{assignment_title}_{assignment_id}/class_reports/
    assignment_dir = get_teacher_assignment_dir(current_user, assignment)
    reports_dir = assignment_dir / "class_reports"
    if not reports_dir.exists():
        # 兼容旧格式：尝试查找旧目录（按ID）
        old_reports_dir = UPLOAD_DIR / "class_reports" / str(assignment_id)
        if old_reports_dir.exists():
            reports_dir = old_reports_dir
        else:
            # 兼容旧格式：尝试查找旧目录（按teacher_id/assignment_id）
            old_reports_dir = TEACHERS_DIR / str(current_user.id) / "assignments" / str(assignment_id) / "class_reports"
            if old_reports_dir.exists():
                reports_dir = old_reports_dir
            else:
                return {"reports": []}
    
    # 获取所有报告文件，按时间倒序排列
    reports = []
    for report_file in sorted(reports_dir.glob("class_report_*.md"), reverse=True):
        try:
            timestamp_str = report_file.stem.replace("class_report_", "")
            # 解析时间戳
            from datetime import datetime
            dt = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            reports.append({
                "timestamp": timestamp_str,
                "created_at": dt.isoformat(),
                "filename": report_file.name
            })
        except:
            continue
    
    return {"reports": reports}

@router.get("/assignments/{assignment_id}/class-report")
async def get_class_report(
    assignment_id: int,
    timestamp: str = Query(None, description="报告时间戳，不提供则返回最新报告"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取全班学情报告（默认最新，或指定时间戳）"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以查看报告")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    assignment_dir = get_teacher_assignment_dir(current_user, assignment)
    
    if timestamp:
        # 获取指定时间戳的报告
        reports_dir = assignment_dir / "class_reports"
        class_report_path = reports_dir / f"class_report_{timestamp}.md"
        # 兼容旧格式
        if not class_report_path.exists():
            # 尝试旧格式：class_reports/{assignment_id}/
            old_reports_dir = UPLOAD_DIR / "class_reports" / str(assignment_id)
            if old_reports_dir.exists():
                class_report_path = old_reports_dir / f"class_report_{timestamp}.md"
            # 尝试旧格式：teachers/{teacher_id}/assignments/{assignment_id}/class_reports/
            if not class_report_path.exists():
                old_reports_dir = TEACHERS_DIR / str(current_user.id) / "assignments" / str(assignment_id) / "class_reports"
                if old_reports_dir.exists():
                    class_report_path = old_reports_dir / f"class_report_{timestamp}.md"
    else:
        # 获取最新报告
        class_report_path = assignment_dir / "class_report_latest.md"
        if not class_report_path.exists():
            # 兼容旧版本：尝试查找旧格式的报告
            # 1. 尝试旧格式：teachers/{teacher_id}/assignments/{assignment_id}/class_report_latest.md
            old_latest_path = TEACHERS_DIR / str(current_user.id) / "assignments" / str(assignment_id) / "class_report_latest.md"
            if old_latest_path.exists():
                class_report_path = old_latest_path
            # 2. 尝试旧格式：assignment_{assignment_id}_class_report_latest.md
            if not class_report_path.exists():
                old_latest_path = UPLOAD_DIR / f"assignment_{assignment_id}_class_report_latest.md"
                if old_latest_path.exists():
                    class_report_path = old_latest_path
            # 3. 尝试旧格式：assignment_{assignment_id}_class_report.md
            if not class_report_path.exists():
                old_report_path = UPLOAD_DIR / f"assignment_{assignment_id}_class_report.md"
                if old_report_path.exists():
                    class_report_path = old_report_path
    
    if not class_report_path.exists():
        raise HTTPException(status_code=404, detail="报告尚未生成，请先生成报告")
    
    return {
        "content": class_report_path.read_text(encoding="utf-8"),
        "timestamp": timestamp
    }

@router.post("/assignments/{assignment_id}/publish-reports")
async def publish_reports(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发布报告给学生"""
    if current_user.role.value != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以发布报告")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    if assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此作业")
    
    # 更新所有提交的状态
    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.status == SubmissionStatus.GRADED
    ).all()
    
    for submission in submissions:
        submission.status = SubmissionStatus.PUBLISHED
    
    db.commit()
    
    return {
        "success": True,
        "message": f"已发布 {len(submissions)} 份报告给学生"
    }

