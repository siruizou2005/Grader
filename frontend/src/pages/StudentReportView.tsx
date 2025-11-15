import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import '../index.css'

export default function StudentReportView() {
  const { id, submissionId } = useParams<{ id: string, submissionId: string }>()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReport()
  }, [id, submissionId])

  const loadReport = async () => {
    try {
      const response = await client.get(`/teachers/assignments/${id}/submissions/${submissionId}/report`)
      setReport(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载报告失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewHomework = () => {
    window.open(`/api/teachers/assignments/${id}/submissions/${submissionId}/homework`, '_blank')
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return (
      <div className="app">
        <div className="container">
          <div className="card">
            <div className="error">{error}</div>
            <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary" style={{ marginTop: '12px' }}>
              返回
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return <div className="card">报告不存在</div>
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>学生批改报告 - {report.student_name}</h1>
        </div>
      </header>
      <div className="container">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary">返回</Link>
          <button className="btn btn-primary" onClick={handleViewHomework}>
            查看作业原件（PDF）
          </button>
        </div>
        {report.grade && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2>学生信息</h2>
            <p><strong>姓名:</strong> {report.student_name}</p>
            <p><strong>学号:</strong> {report.student_id}</p>
            <p><strong>等级:</strong> {report.grade}</p>
          </div>
        )}
        <div className="card">
          <h2>作业 OCR 与批改报告</h2>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            maxHeight: '800px',
            overflow: 'auto'
          }}>
            {report.content}
          </div>
        </div>
      </div>
    </div>
  )
}

