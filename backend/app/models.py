from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class AssignmentStatus(str, enum.Enum):
    DRAFT = "draft"  # 草稿
    PUBLISHED = "published"  # 已发布
    CLOSED = "closed"  # 已关闭

class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"  # 待批改
    GRADED = "graded"  # 已批改
    PUBLISHED = "published"  # 已发布给学生

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)  # 学生姓名（student_name）
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    class_id = Column(String, nullable=False)  # 班级ID（从邀请码提取）
    student_id = Column(String, nullable=True)  # 学号（仅学生需要）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    assignments = relationship("Assignment", back_populates="teacher", foreign_keys="Assignment.teacher_id")
    submissions = relationship("Submission", back_populates="student")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(String, nullable=False)
    status = Column(SQLEnum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    answer_file_path = Column(String)  # 标准答案文件路径
    answer_content = Column(Text)  # 标准答案内容（校对后的）
    deadline = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    teacher = relationship("User", back_populates="assignments", foreign_keys=[teacher_id])
    submissions = relationship("Submission", back_populates="assignment")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    homework_file_path = Column(String, nullable=False)  # 学生作业PDF路径
    report_file_path = Column(String)  # 批改报告MD路径
    json_file_path = Column(String)  # JSON数据路径
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.PENDING)
    grade = Column(String)  # 等级（A+, A, B等）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

