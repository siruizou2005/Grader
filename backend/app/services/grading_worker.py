import asyncio
import logging
import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Submission, SubmissionStatus, Assignment
from app.services.grading_queue import get_grading_queue
from app.core.gemini_client import grade_homework, extract_json_from_report

logger = logging.getLogger(__name__)

async def process_submission(submission_id: int):
    """处理单个作业批改"""
    db: Session = SessionLocal()
    try:
        # 获取submission记录
        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            logger.error(f"Submission {submission_id} not found")
            return
        
        # 获取作业信息
        assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
        if not assignment:
            logger.error(f"Assignment {submission.assignment_id} not found")
            submission.status = SubmissionStatus.FAILED
            db.commit()
            return
            
        if not assignment.answer_content:
            logger.error(f"Assignment {submission.assignment_id} has no answer content")
            # 这里不标记为失败，因为可能是老师还没提取答案，保持PENDING或标记为FAILED视业务逻辑而定
            # 暂时标记为FAILED并提示
            submission.status = SubmissionStatus.FAILED
            db.commit()
            return
        
        logger.info(f"开始批改 submission {submission_id}")
        
        # 更新状态为处理中
        submission.status = SubmissionStatus.PROCESSING
        db.commit()
        
        # 准备路径
        homework_path = Path(submission.homework_file_path)
        if not homework_path.exists():
            logger.error(f"Homework file not found: {homework_path}")
            submission.status = SubmissionStatus.FAILED
            db.commit()
            return

        # 确保答案文件存在
        if not assignment.answer_file_path:
             # 如果没有路径但有内容，尝试恢复文件（防御性编程）
             pass 
        
        answer_path = Path(assignment.answer_file_path) if assignment.answer_file_path else None
        
        # 如果答案文件路径不存在或文件丢失，尝试重新写入临时文件
        if not answer_path or not answer_path.exists():
            # 使用作业目录下的默认位置
            from app.routers.assignments import get_teacher_assignment_dir
            assignment_dir = get_teacher_assignment_dir(assignment.teacher, assignment)
            assignment_dir.mkdir(parents=True, exist_ok=True)
            answer_path = assignment_dir / "answer_selected.md"
            answer_path.write_text(assignment.answer_content, encoding="utf-8")
            
            # 更新路径
            assignment.answer_file_path = str(answer_path)
            db.commit()

        # 调用批改函数 (耗时操作)
        # 注意：grade_homework 是同步还是异步？查看 gemini_client.py 发现它是同步的(def grade_homework)，
        # 但内部使用了 retry 机制。为了不阻塞 Worker 循环，最好在线程池中运行，
        # 或者如果它是IO密集型且内部没有 async，直接调用会阻塞 loop。
        # 鉴于 gemini_client.py 中使用了 google.genai，这通常是同步客户端。
        # 我们使用 asyncio.to_thread 来运行它，避免阻塞主事件循环。
        
        report_md = await asyncio.to_thread(grade_homework, homework_path, answer_path)
        
        # 提取JSON数据
        json_data = extract_json_from_report(report_md)
        
        # 保存批改报告和JSON
        submission_dir = homework_path.parent
        report_path = submission_dir / f"{submission.student.student_id}-{submission.student.username}-report.md"
        json_path = submission_dir / f"{submission.student.student_id}-{submission.student.username}-data.json"
        
        report_path.write_text(report_md, encoding="utf-8")
        json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")
        
        # 更新submission记录
        submission.report_file_path = str(report_path)
        submission.json_file_path = str(json_path)
        submission.grade = json_data.get("grade", "")
        submission.status = SubmissionStatus.GRADED
        
        db.commit()
        logger.info(f"批改完成 submission {submission_id}, 等级: {submission.grade}")
        
    except Exception as e:
        logger.error(f"批改失败 submission {submission_id}: {e}", exc_info=True)
        # 发生异常时标记为失败
        try:
            submission.status = SubmissionStatus.FAILED
            db.commit()
        except:
            pass
        db.rollback()
    finally:
        db.close()

async def start_grading_worker():
    """启动批改Worker（后台任务）"""
    logger.info("批改Worker已启动，等待任务...")
    queue = get_grading_queue()
    
    while True:
        try:
            # 从队列中获取submission_id
            submission_id = await queue.get()
            logger.info(f"从队列中获取到 submission {submission_id}")
            
            # 处理批改
            await process_submission(submission_id)
            
            # 标记任务完成
            queue.task_done()
            
        except asyncio.CancelledError:
            logger.info("Worker任务被取消")
            break
        except Exception as e:
            logger.error(f"Worker循环发生错误: {e}", exc_info=True)
            await asyncio.sleep(5)  # 错误后等待5秒再继续
