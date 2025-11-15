# AI作业批改助手 - Web应用

一个完整的AI作业批改助手Web应用，支持教师创建作业、学生提交作业、AI自动批改和学情分析。

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [环境配置](#环境配置)
- [文件存储结构](#文件存储结构)
- [常见问题](#常见问题)
- [开发说明](#开发说明)

## ✨ 功能特性

### 教师端
- ✅ 用户注册/登录（基于邀请码）
- ✅ 创建作业
- ✅ 上传PDF并提取标准答案
- ✅ 在线编辑和校对答案
- ✅ 发布作业
- ✅ 删除草稿作业
- ✅ 查看学情统计报告
- ✅ 下载Excel成绩汇总
- ✅ 生成全班学情分析报告（支持历史版本）
- ✅ 查看学生批改报告
- ✅ 发布报告给学生

### 学生端
- ✅ 用户注册/登录（基于邀请码）
- ✅ 查看待完成作业列表
- ✅ 上传作业PDF
- ✅ 查看批改报告（教师发布后）

## 🚀 快速开始

### 1. 环境要求

- Python 3.8+
- Node.js 16+
- Google Gemini API密钥（从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取）

### 2. 后端设置

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 创建.env文件
# 复制以下内容到 backend/.env 文件：
# GEMINI_API_KEY=your_gemini_api_key_here
# SECRET_KEY=your_secret_key_for_jwt_here
# DATABASE_URL=sqlite:///./app.db

# 启动后端服务器
python run.py
# 或者
uvicorn app.main:app --reload --port 8000
```

后端将在 http://localhost:8000 启动  
API文档: http://localhost:8000/docs

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 启动

## 📖 使用指南

### 注册账号

1. 访问注册页面 http://localhost:5173/register
2. 选择角色（教师/学生）
3. 填写邀请码：
   - **教师**: `teacher-{班级ID}` (例如: `teacher-1001`)
   - **学生**: `student-{班级ID}` (例如: `student-1001`)
4. 填写用户名和密码完成注册

**注意**: 邀请码格式必须严格按照 `teacher-班级ID` 或 `student-班级ID` 格式，教师和学生必须使用相同的班级ID才能在同一班级。

### 教师创建作业

1. 登录后点击"创建新作业"
2. **步骤1**: 填写作业标题和截止日期
3. **步骤2**: 
   - 上传教师用书PDF文件
   - 输入题目选择说明（例如："选第1、3、5题；第7-9题；其余不选"）
   - 点击"生成作业答案"
   - 等待AI提取答案（可能需要几十秒）
4. **步骤3**: 
   - 查看AI提取的答案
   - 在校对编辑器中修改和确认答案（确保标准答案100%准确）
   - 点击"确认答案"
5. **步骤4**: 点击"发布作业"

### 删除草稿作业

如果创建了草稿作业但不想发布，可以删除：

1. 在作业详情页，如果作业状态为"草稿"，会看到"删除草稿"按钮
2. 点击"删除草稿"按钮
3. 确认删除（删除后将无法恢复，包括所有已上传的文件）
4. 删除成功后自动返回教师主页

**注意**：
- 只能删除草稿状态的作业
- 如果作业已有学生提交，则无法删除
- 删除操作会同时删除数据库记录和相关文件

### 作业状态说明

系统中有三种作业状态：

- **草稿 (DRAFT)**: 作业已创建但尚未发布，只有教师能看到和编辑，可以删除
- **已发布 (PUBLISHED)**: 作业已发布给学生，学生可以看到并提交
- **已关闭 (CLOSED)**: 作业已关闭，不再接受新的提交

### 学生提交作业

1. 登录后查看作业列表
2. 点击要提交的作业卡片
3. 上传作业PDF文件（**仅支持PDF格式**，确保PDF清晰）
4. 点击"提交作业"
5. 等待AI自动批改（可能需要1-2分钟）
6. 教师发布报告后，可查看详细批改结果

### 教师查看学情

1. 在作业详情页点击"查看学情报告"
2. 查看：
   - **整体统计**: 总学生数、提交率、平均等级
   - **等级分布图**: A+, A, B等各等级人数
   - **题目统计**: 每题的正确/错误/部分正确率
   - **关注学生名单**: 未提交或得分较低的学生
3. **下载Excel成绩总表**: 点击"下载Excel成绩总表"下载汇总文件
4. **生成全班学情报告**: 
   - 点击"生成全班学情报告"生成综合分析
   - 点击"查看全班学情报告"查看报告（支持查看历史版本）
5. **查看学生详细报告**: 点击学生姓名查看详细批改报告
6. **发布报告**: 确认无误后，点击"发布报告给学生"

### 标准工作流程

#### 阶段零：用户注册与登录
- 用户通过邀请码注册并登录系统
- 系统自动分配角色和班级

#### 阶段一：教师端 - 作业创建与发布
- 教师上传教师用书PDF
- AI提取指定题目的标准答案
- 教师在线校对和确认答案
- 发布作业给学生

#### 阶段二：学生端 - 作业提交与AI自动批改
- 学生上传作业PDF
- AI自动OCR和批改
- 生成结构化JSON数据和Markdown报告

#### 阶段三：数据汇总与教学闭环
- 教师查看学情统计和Excel汇总
- 生成全班学情分析报告
- 教师发布报告给学生
- 学生查看详细批改结果

## 📁 项目结构

```
Grader/
├── backend/              # FastAPI后端
│   ├── app/
│   │   ├── core/        # 核心功能模块
│   │   │   ├── excel_generator.py      # Excel生成
│   │   │   ├── file_utils.py           # 文件工具（文件名清理等）
│   │   │   ├── gemini_client.py        # Gemini API客户端
│   │   │   ├── invite_code.py          # 邀请码处理
│   │   │   ├── json_processor.py       # JSON处理
│   │   │   └── security.py             # 安全认证
│   │   ├── routers/     # API路由
│   │   │   ├── assignments.py          # 作业管理
│   │   │   ├── auth.py                 # 认证
│   │   │   ├── students.py             # 学生端
│   │   │   └── teachers.py             # 教师端
│   │   ├── models.py    # 数据库模型
│   │   ├── schemas.py   # Pydantic模式
│   │   └── main.py      # 应用入口
│   ├── uploads/         # 文件存储
│   │   ├── teachers/    # 教师文件（按教师名称组织）
│   │   └── submissions/ # 学生提交（按班级组织）
│   ├── app.db           # SQLite数据库
│   ├── requirements.txt # Python依赖
│   └── run.py           # 运行脚本
├── frontend/            # React前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── store/       # 状态管理（Zustand）
│   │   ├── api/         # API客户端
│   │   └── App.tsx      # 主应用组件
│   └── package.json
└── README.md
```

## 🛠 技术栈

### 后端
- **FastAPI** - Web框架
- **SQLAlchemy** - ORM
- **SQLite** - 数据库
- **Google Gemini API** - AI能力（OCR、批改、报告生成）
- **Pandas + OpenPyXL** - Excel生成
- **Pydantic** - 数据验证

### 前端
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由
- **Zustand** - 状态管理
- **Axios** - HTTP客户端
- **React Markdown** - Markdown渲染

## ⚙️ 环境配置

### 后端环境变量 (.env)

在 `backend/` 目录下创建 `.env` 文件：

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_for_jwt_here
DATABASE_URL=sqlite:///./app.db
```

### 获取Gemini API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录Google账号
3. 创建API密钥
4. 将密钥复制到 `.env` 文件的 `GEMINI_API_KEY` 字段

## 📂 文件存储结构

### 教师文件结构

```
uploads/teachers/
└── {teacher_name}_{teacher_id}/          # 教师目录（使用名称+ID）
    └── assignments/
        └── {assignment_title}_{assignment_id}/  # 作业目录（使用标题+ID）
            ├── source/                   # 作业源文件
            │   └── source_*.pdf
            ├── answer_selected.md        # 提取的答案
            ├── combined_reports.md       # 汇总报告（临时）
            ├── class_report_latest.md    # 最新全班报告
            ├── summary.xlsx              # Excel汇总
            └── class_reports/            # 历史报告目录
                └── class_report_{timestamp}.md
```

### 学生提交结构

```
uploads/submissions/
└── {class_id}/                          # 按班级组织
    └── {assignment_id}/
        └── {student_id}-{student_name}/ # 学生文件夹
            ├── *.pdf                    # 作业PDF
            ├── *.md                     # 批改报告
            └── *.json                   # 结构化数据
```

**特点**:
- 教师文件按教师名称和作业标题组织，便于识别
- 学生提交按班级组织，支持多教师场景
- 历史报告永久保存，支持查看历史版本

## ❓ 常见问题

### Q: 注册时提示"邀请码无效"
**A**: 请确保邀请码格式正确：
- 教师: `teacher-{班级ID}` (例如: `teacher-1001`)
- 学生: `student-{班级ID}` (例如: `student-1001`)
- 注意：教师和学生必须使用相同的班级ID才能在同一班级

### Q: 无法提交作业
**A**: 检查以下几点：
1. 作业是否已发布（状态为"已发布"）
2. 文件是否为PDF格式（仅支持PDF）
3. 是否已经提交过（每个作业只能提交一次）
4. PDF文件是否清晰（影响OCR效果）

### Q: 批改失败
**A**: 检查以下几点：
1. PDF文件是否清晰（建议使用扫描版PDF）
2. 网络连接是否正常
3. Gemini API密钥是否有效
4. 查看后端日志输出

### Q: 无法查看报告
**A**: 等待教师发布报告。只有教师点击"发布报告给学生"后，学生才能查看详细批改结果。

### Q: 前端白屏
**A**: 
1. 检查浏览器控制台是否有错误
2. 清除浏览器缓存
3. 确认前端服务正常运行（http://localhost:5173）
4. 检查API连接是否正常

### Q: 文件大小限制
**A**: 
- PDF文件建议不超过20MB
- 如果超过，请先压缩或拆分文件

## 🔧 开发说明

### 数据库

数据库会在首次运行时自动创建。如需重置：

```bash
rm backend/app.db
# 重启服务器会自动重新创建
```

### 开发模式

- **后端热重载**: 使用 `--reload` 参数，修改代码后会自动重启
- **前端热重载**: Vite自动支持，修改代码后会自动刷新浏览器

### 生产部署

#### 后端部署

```bash
# 使用gunicorn部署
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### 前端部署

```bash
cd frontend
npm run build
# 将dist目录部署到静态文件服务器（如Nginx）
```

### 故障排除

#### 后端启动失败
- 检查Python版本（需要Python 3.8+）
- 检查是否安装了所有依赖: `pip install -r requirements.txt`
- 检查.env文件是否存在且配置正确

#### 前端启动失败
- 检查Node.js版本（需要Node.js 16+）
- 删除node_modules后重新安装: `rm -rf node_modules && npm install`

#### API调用失败
- 检查Gemini API密钥是否正确
- 检查网络连接
- 查看后端日志输出

## 📝 注意事项

1. **Gemini API密钥**: 需要在Google AI Studio获取API密钥
2. **文件大小限制**: PDF文件建议不超过20MB
3. **文件格式**: 学生作业仅支持PDF格式
4. **邀请码格式**: 必须严格按照 `teacher-班级ID` 或 `student-班级ID` 格式
5. **文件存储**: 所有上传的文件存储在 `backend/uploads/` 目录
6. **历史报告**: 每次生成全班学情报告都会保存历史版本，可以查看过去的报告


## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**最后更新**: 2025年11月15日
