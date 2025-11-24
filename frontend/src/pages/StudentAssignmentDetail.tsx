import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import ReactMarkdown from 'react-markdown'
import { ChevronLeft, Upload, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import clsx from 'clsx'

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
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || '提交失败')
    } finally {
      setUploading(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          to="/student" 
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
          {assignment.deadline && (
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <Clock size={14} />
              <span>截止日期: {new Date(assignment.deadline).toLocaleString('zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submission Status & Action */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">提交状态</h3>
            
            {!submission ? (
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center hover:border-primary-500 transition-colors bg-slate-50">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-900 block">
                      {file ? file.name : '点击选择PDF文件'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      仅支持 PDF 格式
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button 
                  className="btn btn-primary w-full gap-2" 
                  onClick={handleSubmit} 
                  disabled={uploading || !file}
                >
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                  提交作业
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={clsx(
                  "p-4 rounded-lg border flex items-start gap-3",
                  submission.status === 'pending' ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                  submission.status === 'processing' ? "bg-blue-50 border-blue-200 text-blue-800" :
                  submission.status === 'graded' ? "bg-green-50 border-green-200 text-green-800" :
                  submission.status === 'published' ? "bg-green-50 border-green-200 text-green-800" :
                  "bg-red-50 border-red-200 text-red-800"
                )}>
                  {submission.status === 'processing' ? (
                    <Loader2 className="animate-spin flex-shrink-0 mt-0.5" size={18} />
                  ) : submission.status === 'failed' ? (
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                  ) : (
                    <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
                  )}
                  
                  <div>
                    <div className="font-medium">
                      {submission.status === 'pending' && '已提交，等待进入队列'}
                      {submission.status === 'processing' && '正在智能批改中...'}
                      {submission.status === 'graded' && '批改完成，等待发布'}
                      {submission.status === 'published' && '报告已发布'}
                      {submission.status === 'failed' && '批改失败'}
                    </div>
                    {submission.status === 'processing' && (
                      <div className="text-xs mt-1 opacity-80">通常需要 1-2 分钟，您可以稍后回来查看</div>
                    )}
                  </div>
                </div>

                {submission.status === 'processing' && (
                  <button 
                    className="btn btn-secondary w-full gap-2"
                    onClick={loadData}
                  >
                    <RefreshCw size={16} />
                    刷新状态
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Report Content */}
        <div className="lg:col-span-2">
          {submission && submission.status === 'published' && report ? (
            <div className="card">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="text-slate-400" size={20} />
                  批改报告
                </h3>
                {report.grade && (
                  <div className={clsx(
                    "px-3 py-1 rounded-full text-sm font-bold border",
                    ["A", "A+"].includes(report.grade) ? "bg-green-50 text-green-700 border-green-200" :
                    ["B", "B+"].includes(report.grade) ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    等级: {report.grade}
                  </div>
                )}
              </div>
              <div className="p-8 prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="card h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border-dashed">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>暂无批改报告内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
