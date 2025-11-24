from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, assignments, students, teachers
from app.database import engine, Base

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI作业批改助手", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（生产环境建议限制具体域名）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["作业"])
app.include_router(students.router, prefix="/api/students", tags=["学生"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["教师"])

@app.get("/")
async def root():
    return {"message": "AI作业批改助手API"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    """启动时开始批改Worker"""
    import asyncio
    from app.services.grading_worker import start_grading_worker
    asyncio.create_task(start_grading_worker())

