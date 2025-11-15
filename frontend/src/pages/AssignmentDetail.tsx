import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import '../index.css'

interface Assignment {
  id: number
  title: string
  status: string
  answer_content: string
  deadline: string | null
  created_at: string
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  
  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editAnswerContent, setEditAnswerContent] = useState('')

  useEffect(() => {
    loadAssignment()
  }, [id])

  const loadAssignment = async () => {
    try {
      const response = await client.get(`/assignments/${id}`)
      const data = response.data
      setAssignment(data)
      setEditTitle(data.title)
      setEditDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '')
      setEditAnswerContent(data.answer_content || '')
    } catch (error) {
      console.error('加载作业失败:', error)
      setError('加载作业失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!assignment) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updateData: any = {}
      if (editTitle !== assignment.title) {
        updateData.title = editTitle
      }
      if (editDeadline !== (assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '')) {
        updateData.deadline = editDeadline ? new Date(editDeadline).toISOString() : null
      }
      if (editAnswerContent !== (assignment.answer_content || '')) {
        updateData.answer_content = editAnswerContent
      }

      if (Object.keys(updateData).length === 0) {
        setSuccess('没有修改')
        setIsEditing(false)
        setSaving(false)
        return
      }

      await client.put(`/assignments/${id}`, updateData)
      setSuccess('保存成功！')
      setIsEditing(false)
      await loadAssignment() // 重新加载数据
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!assignment) return
    
    if (!assignment.answer_content) {
      setError('请先保存答案内容')
      return
    }

    if (!confirm('确定要发布这个作业吗？发布后学生就可以看到并提交了。')) {
      return
    }

    setPublishing(true)
    setError('')
    setSuccess('')

    try {
      await client.post(`/assignments/${id}/publish`)
      setSuccess('作业已发布！学生现在可以看到这个作业了。')
      await loadAssignment() // 重新加载数据
    } catch (err: any) {
      setError(err.response?.data?.detail || '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  const handleCancelEdit = () => {
    if (assignment) {
      setEditTitle(assignment.title)
      setEditDeadline(assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '')
      setEditAnswerContent(assignment.answer_content || '')
    }
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleDelete = async () => {
    if (!assignment) return
    
    if (!confirm('确定要删除这个草稿作业吗？删除后将无法恢复，包括所有已上传的文件。')) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await client.delete(`/assignments/${id}`)
      setSuccess('作业已删除')
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/teacher')
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.detail || '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!assignment) {
    return <div className="card">作业不存在</div>
  }

  const isTeacher = user?.role === 'teacher'
  const isDraft = assignment.status === 'draft'

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>{isEditing ? '编辑作业' : assignment.title}</h1>
        </div>
      </header>
      <div className="container">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/teacher" className="btn btn-secondary">返回</Link>
          {isTeacher && isDraft && !isEditing && (
            <>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                编辑作业
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handlePublish} 
                disabled={publishing || !assignment.answer_content}
                style={{ background: '#28a745' }}
              >
                {publishing ? '发布中...' : '发布作业'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleDelete} 
                disabled={deleting}
                style={{ background: '#dc3545', color: 'white' }}
              >
                {deleting ? '删除中...' : '删除草稿'}
              </button>
            </>
          )}
          {isTeacher && assignment.status === 'published' && (
            <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-primary">
              查看学情报告
            </Link>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success" style={{ padding: '12px', marginBottom: '20px' }}>{success}</div>}

        {isEditing ? (
          <div className="card">
            <h2>编辑作业信息</h2>
            <div className="form-group">
              <label>作业标题</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="请输入作业标题"
              />
            </div>
            <div className="form-group">
              <label>截止日期</label>
              <input
                type="datetime-local"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>标准答案</label>
              <textarea
                value={editAnswerContent}
                onChange={(e) => setEditAnswerContent(e.target.value)}
                placeholder="请输入或编辑标准答案"
                rows={20}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelEdit}
                disabled={saving}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <h2>作业信息</h2>
              <p><strong>状态:</strong> 
                <span style={{ 
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: assignment.status === 'draft' ? '#ffc107' : assignment.status === 'published' ? '#28a745' : '#6c757d',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {assignment.status === 'draft' ? '草稿' : assignment.status === 'published' ? '已发布' : '已关闭'}
                </span>
              </p>
              <p><strong>创建时间:</strong> {new Date(assignment.created_at).toLocaleString('zh-CN')}</p>
              {assignment.deadline && (
                <p><strong>截止日期:</strong> {new Date(assignment.deadline).toLocaleString('zh-CN')}</p>
              )}
            </div>
            {assignment.answer_content && (
              <div className="card">
                <h2>标准答案</h2>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  maxHeight: '600px',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
                  {assignment.answer_content}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
