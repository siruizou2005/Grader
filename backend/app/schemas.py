from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, AssignmentStatus, SubmissionStatus

# 用户相关
class UserRegister(BaseModel):
    username: str  # 学生姓名（student_name）
    password: str
    role: UserRole
    invite_code: str
    student_id: Optional[str] = None  # 学号（仅学生需要）

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    class_id: str
    student_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# 作业相关
class AssignmentCreate(BaseModel):
    title: str
    class_id: str
    deadline: Optional[datetime] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    deadline: Optional[datetime] = None
    answer_content: Optional[str] = None

class AnswerUpdate(BaseModel):
    answer_content: str

class AssignmentResponse(BaseModel):
    id: int
    title: str
    teacher_id: int
    class_id: str
    status: AssignmentStatus
    answer_file_path: Optional[str]
    deadline: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssignmentDetail(AssignmentResponse):
    answer_content: Optional[str]

# 提交相关
class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    homework_file_path: str
    report_file_path: Optional[str]
    json_file_path: Optional[str]
    status: SubmissionStatus
    grade: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubmissionDetail(BaseModel):
    id: int
    assignment_id: int
    student_id: int  # 数据库中的student_id（用户ID）
    homework_file_path: str
    report_file_path: Optional[str]
    json_file_path: Optional[str]
    status: SubmissionStatus
    grade: Optional[str]
    created_at: datetime
    student_name: str  # 学生姓名
    student_id_str: str  # 学号（字符串格式）
    
    class Config:
        from_attributes = True

# 学情分析
class QuestionStats(BaseModel):
    key: str
    correct_count: int
    partial_count: int
    wrong_count: int
    total_count: int

class AssignmentStats(BaseModel):
    total_students: int
    submitted_count: int
    submission_rate: float
    average_grade: Optional[str]
    grade_distribution: dict
    question_stats: List[QuestionStats]
    low_score_students: List[dict]

