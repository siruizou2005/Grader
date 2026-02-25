# Grader — AI Homework Grading Assistant

A full-stack web application that uses AI to automate homework grading. Teachers create and publish assignments; students submit PDF work; Gemini AI performs OCR, grades each problem, and generates detailed feedback reports.

[中文文档](./README_zh.md)

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [File Storage Layout](#file-storage-layout)
- [FAQ](#faq)
- [Development Notes](#development-notes)

---

## Features

### Teacher

- Invite-code based registration / login
- Create assignments with title and deadline
- Upload teacher's edition PDF → AI extracts model answers
- Online answer review and correction editor
- Publish / delete draft assignments
- View class-wide learning analytics dashboard
- Download Excel grade summary
- Generate class learning reports (with full version history)
- View individual student grading reports
- Publish reports to students

### Student

- Invite-code based registration / login
- Browse assigned homework list
- Upload completed homework as PDF
- View detailed AI grading report (after teacher publishes)

---

## Quick Start

### Requirements

- Python 3.8+
- Node.js 16+
- Redis (task queue)
- Google Gemini API key — get one at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Install Redis

**macOS**
```bash
brew install redis
brew services start redis
```

**Ubuntu / Debian**
```bash
sudo apt-get update && sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows** — download from [microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases)

### 2. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create backend/.env (see Environment Variables below)

# Terminal 1 — API server
python run.py
# or: uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery worker (required for async tasks)
./start_celery.sh
# or: celery -A app.celery_app worker --loglevel=info --concurrency=4
```

> API server: http://localhost:8000
> Swagger docs: http://localhost:8000/docs
> **Both the API server and Celery worker must be running.** Long-running tasks (answer extraction, grading, report generation) are handled asynchronously by Celery.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

> Frontend: http://localhost:5173

---

## User Guide

### Registration

1. Go to http://localhost:5173/register
2. Select role (Teacher / Student)
3. Enter invite code:
   - **Teacher**: `teacher-{classID}` — e.g. `teacher-1001`
   - **Student**: `student-{classID}` — e.g. `student-1001`
4. Set username and password

> Teachers and students must use the **same class ID** to be in the same class.

---

### Teacher: Create an Assignment

1. Click **Create New Assignment**
2. **Step 1** — Enter title and deadline
3. **Step 2** — Upload teacher's edition PDF; describe which problems to include (e.g. "problems 1, 3, 5; 7–9; skip the rest"); click **Extract Answers** (runs in background — page polls for status)
4. **Step 3** — Review and correct AI-extracted answers in the inline editor; click **Confirm Answers**
5. **Step 4** — Click **Publish Assignment**

### Assignment Statuses

| Status | Meaning |
|--------|---------|
| **DRAFT** | Created but not published — visible only to the teacher; can be deleted |
| **PUBLISHED** | Visible to students; accepts submissions |
| **CLOSED** | No longer accepts new submissions |

### Delete a Draft

1. On the assignment detail page, click **Delete Draft** (only shown for DRAFT assignments)
2. Confirm — this permanently deletes the database record and all uploaded files
3. Assignments that already have student submissions cannot be deleted

---

### Student: Submit Homework

1. Click an assignment card from the homework list
2. Upload your completed homework as a PDF (PDF only; ensure it is legible)
3. Click **Submit** — AI grading runs in the background (typically 1–2 minutes)
4. After the teacher publishes the report, your detailed feedback becomes visible

---

### Teacher: View Analytics

1. Click **View Class Report** on the assignment detail page
2. Dashboard shows:
   - Overall stats: total students, submission rate, average grade
   - Grade distribution: A+, A, B, C, etc.
   - Per-problem accuracy breakdown
   - At-risk students (not submitted or low scores)
3. **Download Excel Summary** — full grade export
4. **Generate Class Report** — AI-written narrative analysis (historical versions saved automatically)
5. Click a student's name to view their individual grading report
6. Click **Publish Reports to Students** when ready

---

### Standard Workflow

```
Phase 0 — Registration
  └── Users register with invite codes; system assigns role and class

Phase 1 — Teacher: Assignment Creation
  └── Upload PDF → AI extracts answers → Teacher reviews → Publish

Phase 2 — Student: Submission & Auto-Grading
  └── Student uploads PDF → AI OCR + grading → JSON + Markdown report generated

Phase 3 — Analytics & Feedback Loop
  └── Teacher reviews dashboard → generates class report → publishes to students
      └── Students view detailed feedback
```

---

## Project Structure

```
Grader/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── excel_generator.py    # Excel export
│   │   │   ├── file_utils.py         # Filename sanitization
│   │   │   ├── gemini_client.py      # Gemini API client
│   │   │   ├── invite_code.py        # Invite code logic
│   │   │   ├── json_processor.py     # JSON processing
│   │   │   └── security.py           # JWT auth
│   │   ├── routers/
│   │   │   ├── assignments.py        # Assignment management
│   │   │   ├── auth.py               # Authentication
│   │   │   ├── students.py           # Student endpoints
│   │   │   └── teachers.py           # Teacher endpoints
│   │   ├── models.py                 # SQLAlchemy models
│   │   ├── schemas.py                # Pydantic schemas
│   │   └── main.py                   # App entry point
│   ├── uploads/
│   │   ├── teachers/                 # Teacher files
│   │   └── submissions/              # Student submissions
│   ├── app.db                        # SQLite database
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   ├── store/                    # Zustand state
│   │   ├── api/                      # API client
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## Tech Stack

### Backend

| Library | Role |
|---------|------|
| FastAPI | Web framework |
| SQLAlchemy | ORM |
| SQLite | Database |
| Celery + Redis | Async task queue |
| Google Gemini API | OCR, grading, report generation |
| Pandas + OpenPyXL | Excel export |
| Pydantic | Data validation |

### Frontend

| Library | Role |
|---------|------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| React Router | Routing |
| Zustand | State management |
| Axios | HTTP client |
| React Markdown | Markdown rendering |

---

## Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_for_jwt_here
DATABASE_URL=sqlite:///./app.db
REDIS_URL=redis://localhost:6379/0
```

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## File Storage Layout

### Teacher files

```
uploads/teachers/
└── {teacher_name}_{teacher_id}/
    └── assignments/
        └── {assignment_title}_{assignment_id}/
            ├── source/
            │   └── source_*.pdf           # Uploaded teacher's edition
            ├── answer_selected.md         # AI-extracted answers
            ├── class_report_latest.md     # Latest class report
            ├── summary.xlsx               # Grade summary
            └── class_reports/
                └── class_report_{timestamp}.md   # Historical reports
```

### Student submissions

```
uploads/submissions/
└── {class_id}/
    └── {assignment_id}/
        └── {student_id}-{student_name}/
            ├── *.pdf       # Submitted homework
            ├── *.md        # Grading report
            └── *.json      # Structured grading data
```

---

## FAQ

**Q: "Invalid invite code" on registration**
Invite codes must follow `teacher-{classID}` or `student-{classID}` exactly (e.g. `teacher-1001`). Teacher and student must use the same class ID.

**Q: Cannot submit assignment**
- Assignment must be in PUBLISHED status
- File must be PDF
- Each student can only submit once
- Ensure the PDF is legible (affects OCR accuracy)

**Q: Grading failed**
- Use a clear, well-scanned PDF
- Verify network connectivity
- Check that the Gemini API key is valid
- Check backend logs for details

**Q: Cannot view grading report**
The teacher must click "Publish Reports to Students" before reports become visible to students.

**Q: Frontend shows blank page**
1. Check browser console for errors
2. Clear browser cache
3. Confirm the dev server is running at http://localhost:5173
4. Check that the backend API is reachable

**Q: PDF file size limit**
Keep PDF files under 20 MB. Compress or split larger files before uploading.

---

## Development Notes

### Reset the database

```bash
rm backend/app.db
# Restart the server — tables are recreated automatically
```

### Hot reload

- **Backend**: pass `--reload` to uvicorn
- **Frontend**: Vite HMR is enabled by default

### Production deployment

**Backend**
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

**Frontend**
```bash
cd frontend
npm run build
# Serve the dist/ directory with Nginx or any static file host
```

### Troubleshooting

| Symptom | Check |
|---------|-------|
| Backend fails to start | Python ≥ 3.8; all deps installed; `.env` present and correct |
| Frontend fails to start | Node.js ≥ 16; try `rm -rf node_modules && npm install` |
| API calls fail | Gemini API key valid; network reachable; check backend logs |

---

## Contributing

Issues and pull requests are welcome.
