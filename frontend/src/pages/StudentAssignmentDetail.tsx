import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import ReactMarkdown from 'react-markdown'
import '../index.css'

interface Assignment {
  id: number
  title: string
  deadline: string | null
}

interface Submission {
  id: number
  status: string
  grade: string | null
}

export default function StudentAssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [report, setReport] = useState<{ content: string; grade: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        client.get(`/assignments/${id}`),
        client.get(`/students/assignments/${id}/submission`).catch((err) => {
          console.log('获取提交记录:', err.response?.status, err.response?.data)
          return null
        })
      ])
      setAssignment(assignmentRes.data)
      if (submissionRes && submissionRes.data) {
        console.log('提交记录:', submissionRes.data)
        setSubmission(submissionRes.data)
        if (submissionRes.data.status === 'published') {
          loadReport()
        }
      }
    } catch (error: any) {
      console.error('加载数据失败:', error)
      if (error.response?.status !== 404) {
        setError(error.response?.data?.detail || '加载数据失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async () => {
    try {
      const response = await client.get(`/students/assignments/${id}/report`)
      setReport(response.data)
    } catch (error) {
      console.error('加载报告失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('请选择PDF文件')
      return
    }

    if (!file.name.endsWith('.pdf')) {
      setError('仅支持PDF格式')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('homework_file', file)

      await client.post(`/students/assignments/${id}/submit`, formData)

      alert('作业提交成功，批改中...')
      setTimeout(() => {
        loadData()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || '提交失败')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!assignment) {
    return <div className="card">作业不存在</div>
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>{assignment.title}</h1>
        </div>
      </header>
      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/student" className="btn btn-secondary">返回</Link>
        </div>

        {!submission && (
          <div className="card">
            <h2>提交作业</h2>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              请上传您的作业PDF文件。确保PDF清晰、无阴影。
            </p>
            <div className="form-group">
              <label>选择PDF文件</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading || !file}>
              {uploading ? '提交中...' : '提交作业'}
            </button>
          </div>
        )}

        {submission && submission.status === 'pending' && (
          <div className="card">
            <div className="success">作业已提交，正在批改中...</div>
          </div>
        )}

        {submission && submission.status === 'graded' && (
          <div className="card">
            <div className="success">作业已批改完成，等待教师发布报告</div>
            {submission.grade && (
              <div style={{ marginTop: '12px' }}>
                <strong>等级:</strong> {submission.grade}
              </div>
            )}
          </div>
        )}

        {submission && submission.status === 'published' && report && (
          <div className="card">
            <h2>批改报告</h2>
            {report.grade && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#e7f3ff', borderRadius: '4px' }}>
                <strong>等级:</strong> {report.grade}
              </div>
            )}
            <div style={{ 
              background: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '4px',
              maxHeight: '600px',
              overflow: 'auto'
            }}>
              <ReactMarkdown>{report.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

