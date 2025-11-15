import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'
import '../index.css'
import './Dashboard.css'

interface Assignment {
  id: number
  title: string
  status: string
  created_at: string
}

export default function TeacherDashboard() {
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

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      closed: '已关闭'
    }
    return map[status] || status
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>AI作业批改助手 - 教师端</h1>
          <div className="header-actions">
            <span>欢迎，{user?.username}老师</span>
            <button className="btn btn-secondary" onClick={logout}>退出</button>
          </div>
        </div>
      </header>
      <nav className="nav">
        <div className="nav-content">
          <Link to="/teacher" className="nav-link active">我的作业</Link>
        </div>
      </nav>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>作业列表</h2>
          <Link to="/teacher/assignments/new" className="btn btn-primary">创建新作业</Link>
        </div>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : assignments.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>还没有作业，点击"创建新作业"开始</p>
          </div>
        ) : (
          <div className="assignment-grid">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card" onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}>
                <h3>{assignment.title}</h3>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`status-badge status-${assignment.status}`}>
                    {getStatusText(assignment.status)}
                  </span>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {new Date(assignment.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

