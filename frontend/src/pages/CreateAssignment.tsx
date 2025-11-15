import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import '../index.css'

export default function CreateAssignment() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [teacherMsg, setTeacherMsg] = useState('')
  const [answerContent, setAnswerContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assignmentId, setAssignmentId] = useState<number | null>(null)

  // 检查认证状态
  if (!isAuthenticated || !user) {
    return (
      <div className="app">
        <div className="container">
          <div className="card">
            <div className="error">未登录，请先登录</div>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              前往登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateAssignment = async () => {
    if (!title) {
      setError('请输入作业标题')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await client.post('/assignments/', {
        title,
        class_id: user?.class_id,
        deadline: deadline || null
      })
      setAssignmentId(response.data.id)
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建作业失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractAnswer = async () => {
    if (!pdfFile) {
      setError('请上传PDF文件')
      return
    }
    if (!teacherMsg) {
      setError('请输入题目选择说明')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('pdf_file', pdfFile)
      formData.append('teacher_msg', teacherMsg)

      const response = await client.post(
        `/assignments/${assignmentId}/extract-answer`,
        formData
      )

      setAnswerContent(response.data.answer_content)
      setStep(3)
    } catch (err: any) {
      console.error('提取答案失败:', err)
      const errorDetail = err.response?.data?.detail || err.message || '提取答案失败'
      
      // 如果是503错误（API过载），提供更友好的提示
      if (err.response?.status === 503 || errorDetail.includes('过载') || errorDetail.includes('overloaded')) {
        setError('Gemini API当前过载，系统已自动重试。如果仍然失败，请稍后重试。如果问题持续，可能是API配额已用完或服务暂时不可用。')
      } else {
        setError(errorDetail)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnswer = async () => {
    if (!answerContent.trim()) {
      setError('答案内容不能为空')
      return
    }

    if (!assignmentId) {
      setError('作业ID不存在，请重新创建作业')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await client.put(`/assignments/${assignmentId}/answer`, {
        answer_content: answerContent
      })
      console.log('保存答案成功:', response.data)
      // 确保响应成功后再切换步骤
      if (response.status === 200) {
        setStep(4)
        setError('') // 清除之前的错误
      } else {
        setError('保存失败，请重试')
      }
    } catch (err: any) {
      console.error('保存答案失败:', err)
      setError(err.response?.data?.detail || err.message || '保存答案失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    setError('')

    try {
      await client.post(`/assignments/${assignmentId}/publish`)
      navigate(`/teacher/assignments/${assignmentId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>创建新作业</h1>
        </div>
      </header>
      <div className="container">
        <div className="card">
          {/* 显示当前步骤 */}
          {step > 0 && step < 5 && (
            <div style={{ marginBottom: '20px', padding: '8px 12px', background: '#e7f3ff', borderRadius: '4px', fontSize: '14px', color: '#0066cc' }}>
              步骤 {step}/4
            </div>
          )}
          
          {step === 1 && (
            <>
              <h2>步骤 1: 基本信息</h2>
              <div className="form-group">
                <label>作业标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：第一章 函数与极限 课后练习"
                />
              </div>
              <div className="form-group">
                <label>截止日期（可选）</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn btn-primary" onClick={handleCreateAssignment} disabled={loading}>
                {loading ? '创建中...' : '下一步：上传PDF'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>步骤 2: 提取答案</h2>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                上传教师用书PDF，系统将自动提取所选题目及其标准答案。
              </p>
              <div className="form-group">
                <label>上传教师用书PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-group">
                <label>题目选择说明</label>
                <textarea
                  value={teacherMsg}
                  onChange={(e) => setTeacherMsg(e.target.value)}
                  placeholder="例如：选第 1、3、5 题；第 7-9 题；其余不选"
                  rows={4}
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  系统将根据您的选择，从PDF中提取对应的题目和标准答案
                </small>
              </div>
              {error && <div className="error">{error}</div>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
                <button className="btn btn-primary" onClick={handleExtractAnswer} disabled={loading}>
                  {loading ? '提取中...' : '提取题目和答案'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>步骤 3: 校对答案</h2>
              <div className="form-group">
                <label>答案内容（可编辑）</label>
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  rows={30}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                  placeholder="在此编辑Markdown格式的答案内容..."
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>上一步</button>
                <button className="btn btn-primary" onClick={handleSaveAnswer} disabled={loading}>
                  {loading ? '保存中...' : '确认答案'}
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>步骤 4: 发布作业</h2>
              <div className="success" style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '20px' }}>
                ✅ 答案已确认并保存！
                {assignmentId && <div style={{ marginTop: '8px', fontSize: '14px' }}>作业ID: {assignmentId}</div>}
              </div>
              {error && <div className="error">{error}</div>}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(3)}>返回编辑</button>
                <button className="btn btn-primary" onClick={handlePublish} disabled={loading}>
                  {loading ? '发布中...' : '发布作业'}
                </button>
              </div>
            </>
          )}
          
          {/* 调试信息 - 开发时可见 */}
          {import.meta.env.MODE === 'development' && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
              <div>当前步骤: {step}</div>
              <div>作业ID: {assignmentId || '未设置'}</div>
              <div>答案内容长度: {answerContent.length} 字符</div>
              {error && <div style={{ color: 'red' }}>错误: {error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

