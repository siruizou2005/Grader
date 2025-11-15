import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import '../index.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!inviteCode) {
      setError('请输入邀请码')
      return
    }

    // 验证学生必须提供学号
    if (role === 'student' && !studentId.trim()) {
      setError('学生注册必须提供学号')
      return
    }

    setLoading(true)

    try {
      await register(username, password, role, inviteCode, role === 'student' ? studentId : undefined)
      if (role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请检查输入信息')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '400px' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>注册</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{role === 'student' ? '姓名' : '用户名'}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'student' ? '请输入您的姓名' : '请输入用户名'}
              required
            />
          </div>
          {role === 'student' && (
            <div className="form-group">
              <label>学号</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="请输入学号"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>角色</label>
            <select value={role} onChange={(e) => {
              setRole(e.target.value as 'teacher' | 'student')
              // 切换角色时清空学号
              if (e.target.value === 'teacher') {
                setStudentId('')
              }
            }}>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <div className="form-group">
            <label>邀请码</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="例如: teacher-101 或 student-101"
              required
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              教师邀请码格式: teacher-班级ID，学生邀请码格式: student-班级ID
            </small>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/login">已有账号？立即登录</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

