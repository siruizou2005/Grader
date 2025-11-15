import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'
import '../index.css'
import './Dashboard.css'

interface Assignment {
  id: number
  title: string
  deadline: string | null
  created_at: string
}

export default function StudentDashboard() {
  const { user, logout } = useAuthStore()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const response = await client.get('/assignments/')
      setAssignments(response.data)
    } catch (error) {
      console.error('加载作业失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>AI作业批改助手 - 学生端</h1>
          <div className="header-actions">
            <span>欢迎，{user?.username}</span>
            <button className="btn btn-secondary" onClick={logout}>退出</button>
          </div>
        </div>
      </header>
      <nav className="nav">
        <div className="nav-content">
          <Link to="/student" className="nav-link active">待完成作业</Link>
        </div>
      </nav>
      <div className="container">
        <h2 style={{ marginBottom: '20px' }}>作业列表</h2>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : assignments.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>暂无作业</p>
          </div>
        ) : (
          <div className="assignment-grid">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card" onClick={() => navigate(`/student/assignments/${assignment.id}`)}>
                <h3>{assignment.title}</h3>
                <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
                  {assignment.deadline && (
                    <div>截止日期: {new Date(assignment.deadline).toLocaleDateString('zh-CN')}</div>
                  )}
                  <div style={{ marginTop: '4px' }}>发布时间: {new Date(assignment.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#007bff' }}>
                  点击查看详情
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

