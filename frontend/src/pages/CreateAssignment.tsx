import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, Calendar, Clock, X, Maximize2, FileText } from 'lucide-react'

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
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 检查认证状态
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            未登录，请先登录
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            前往登录
          </button>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/teacher" 
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">创建新作业</h1>
          <p className="text-slate-500 mt-1">按照步骤完成作业创建</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {step > 0 && step < 5 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-primary-700 font-medium">步骤 {step}/4</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all ${
                    s <= step ? 'bg-primary-600' : 'bg-primary-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 md:p-8">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-6">步骤 1: 基本信息</h2>
            <div className="space-y-6">
              <div>
                <label className="label mb-2 block">作业标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：第一章 函数与极限 课后练习"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label mb-2 block flex items-center gap-2">
                  <Calendar size={16} className="text-slate-500" />
                  截止日期（可选）
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 group-hover:text-primary-500 transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input w-full pl-10 pr-10 cursor-pointer hover:border-primary-300 focus:border-primary-500 transition-all duration-200 focus:ring-2 focus:ring-primary-200"
                  />
                  {deadline && (
                    <>
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Clock size={16} className="text-primary-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeadline('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                        title="清除日期"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
                {deadline && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-gradient-to-r from-primary-50 to-blue-50 px-4 py-2.5 rounded-lg border border-primary-200 shadow-sm">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Calendar size={14} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">已设置截止时间</div>
                      <div className="text-slate-600 mt-0.5">
                        {new Date(deadline).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {!deadline && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <Clock size={14} className="mt-0.5 text-slate-400" />
                    <span>不设置截止日期表示作业长期有效，学生可以随时提交</span>
                  </div>
                )}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button className="btn btn-primary gap-2" onClick={handleCreateAssignment} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      创建中...
                    </>
                  ) : (
                    '下一步：上传PDF'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-6">步骤 2: 提取答案</h2>
            <div className="space-y-6">
              <p className="text-slate-600">
                上传教师用书PDF，系统将自动提取所选题目及其标准答案。
              </p>
              <div>
                <label className="label mb-2 block">上传教师用书PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="input w-full"
                />
                {pdfFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={16} />
                    已选择: {pdfFile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="label mb-2 block">题目选择说明</label>
                <textarea
                  value={teacherMsg}
                  onChange={(e) => setTeacherMsg(e.target.value)}
                  placeholder="例如：选第 1、3、5 题；第 7-9 题；其余不选"
                  rows={4}
                  className="input w-full"
                />
                <small className="text-slate-500 text-xs mt-2 block">
                  系统将根据您的选择，从PDF中提取对应的题目和标准答案
                </small>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-between">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
                <button className="btn btn-primary gap-2" onClick={handleExtractAnswer} disabled={loading || !pdfFile || !teacherMsg}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      提取中...
                    </>
                  ) : (
                    '提取题目和答案'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-6">步骤 3: 校对答案</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0 flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    答案内容（可编辑）
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {answerContent.length.toLocaleString()} 字符
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-xs text-slate-600 hover:text-primary-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      title={isFullscreen ? "退出全屏" : "全屏编辑"}
                    >
                      <Maximize2 size={14} />
                      {isFullscreen ? '退出全屏' : '全屏编辑'}
                    </button>
                  </div>
                </div>
                <div className={`relative ${isFullscreen ? 'fixed inset-4 z-50 bg-white rounded-lg shadow-2xl p-6' : ''}`}>
                  {isFullscreen && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {answerContent.length.toLocaleString()} 字符
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="退出全屏"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    className={`input w-full font-mono text-sm leading-relaxed ${
                      isFullscreen 
                        ? 'h-[calc(100vh-12rem)] text-base' 
                        : 'min-h-[600px]'
                    }`}
                    placeholder="在此编辑Markdown格式的答案内容..."
                    style={{
                      resize: isFullscreen ? 'none' : 'vertical'
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>💡 提示：支持 Markdown 格式，包括数学公式（LaTeX）</span>
                  {answerContent.length > 0 && (
                    <span className="text-green-600">
                      ✓ 内容已加载
                    </span>
                  )}
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>上一步</button>
                <button className="btn btn-primary gap-2" onClick={handleSaveAnswer} disabled={loading || !answerContent.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      保存中...
                    </>
                  ) : (
                    '确认答案'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-6">步骤 4: 发布作业</h2>
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <div className="font-medium">答案已确认并保存！</div>
                  {assignmentId && (
                    <div className="mt-2 text-sm">作业ID: {assignmentId}</div>
                  )}
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-between">
                <button className="btn btn-secondary" onClick={() => setStep(3)}>返回编辑</button>
                <button className="btn btn-primary gap-2" onClick={handlePublish} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      发布中...
                    </>
                  ) : (
                    '发布作业'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* 调试信息 - 开发时可见 */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs space-y-1">
            <div>当前步骤: {step}</div>
            <div>作业ID: {assignmentId || '未设置'}</div>
            <div>答案内容长度: {answerContent.length} 字符</div>
            {error && <div className="text-red-600">错误: {error}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

