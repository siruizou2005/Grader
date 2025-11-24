import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import { ChevronLeft, Save, Send, Trash2, Edit2, Calendar, Clock, AlertCircle, CheckCircle2, FileText, Loader2, BarChart2 } from 'lucide-react'
import clsx from 'clsx'

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
      await loadAssignment()
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
      setSuccess('作业已发布！')
      await loadAssignment()
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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary-600 h-8 w-8" />
      </div>
    )
  }

  if (!assignment) {
    return <div className="card p-8 text-center text-slate-500">作业不存在</div>
  }

  const isTeacher = user?.role === 'teacher'
  const isDraft = assignment.status === 'draft'

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/teacher" 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? '编辑作业' : assignment.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className={clsx(
                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                assignment.status === 'draft' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                assignment.status === 'published' ? "bg-green-50 text-green-700 border-green-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {assignment.status === 'draft' ? '草稿' : assignment.status === 'published' ? '已发布' : '已关闭'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(assignment.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isTeacher && isDraft && !isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary gap-2"
              >
                <Edit2 size={16} />
                编辑
              </button>
              <button 
                onClick={handlePublish}
                disabled={publishing || !assignment.answer_content}
                className="btn btn-primary gap-2 bg-green-600 hover:bg-green-700"
              >
                {publishing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                发布作业
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger gap-2"
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                删除
              </button>
            </>
          )}
          {isTeacher && assignment.status === 'published' && (
            <Link 
              to={`/teacher/assignments/${id}/stats`} 
              className="btn btn-primary gap-2"
            >
              <BarChart2 size={16} />
              查看学情报告
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 flex-shrink-0" size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meta Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              时间安排
            </h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="label mb-1.5 block">作业标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input"
                    placeholder="请输入作业标题"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">截止日期</label>
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">截止日期</div>
                  <div className="font-medium text-slate-900">
                    {assignment.deadline 
                      ? new Date(assignment.deadline).toLocaleString('zh-CN') 
                      : '无截止日期'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">创建时间</div>
                  <div className="font-medium text-slate-900">
                    {new Date(assignment.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Answer Content */}
        <div className="lg:col-span-2">
          <div className="card flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-slate-400" />
                标准答案
              </h3>
              {isEditing && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="btn btn-secondary text-xs py-1 h-8"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary text-xs py-1 h-8 gap-1"
                  >
                    {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                    保存
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="p-0 flex-1">
                <textarea
                  value={editAnswerContent}
                  onChange={(e) => setEditAnswerContent(e.target.value)}
                  placeholder="在此输入标准答案 Markdown 内容..."
                  className="w-full h-[600px] p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed bg-slate-50"
                />
              </div>
            ) : (
              <div className="p-6 bg-slate-50/50 min-h-[200px]">
                {assignment.answer_content ? (
                  <div className="prose prose-slate prose-sm max-w-none font-mono bg-white p-6 rounded-lg border border-slate-200 shadow-sm overflow-auto max-h-[600px]">
                    <pre className="whitespace-pre-wrap">{assignment.answer_content}</pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    暂无标准答案内容
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
