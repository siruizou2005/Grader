import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import { useLoadingStore } from '../store/loadingStore'
import { ChevronLeft, Download, FileText, Users, CheckCircle2, BarChart2, Loader2, AlertCircle, Eye } from 'lucide-react'
import clsx from 'clsx'

interface Stats {
  total_students: number
  submitted_count: number
  submission_rate: number
  average_grade: string | null
  grade_distribution: Record<string, number>
  question_stats: Array<{
    key: string
    correct_count: number
    partial_count: number
    wrong_count: number
    total_count: number
  }>
  low_score_students: Array<{
    student_id: number
    student_name: string
    grade: string
  }>
}

interface Submission {
  id: number
  student_name: string
  student_id: string
  student_id_str: string
  grade: string | null
  status: string
  homework_file_path?: string
  report_file_path?: string
}

export default function AssignmentStats() {
  const { id } = useParams<{ id: string }>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [loadingHomework, setLoadingHomework] = useState<number | null>(null)
  const [hasReports, setHasReports] = useState(false)
  const { addBackgroundTask, removeBackgroundTask } = useLoadingStore()

  useEffect(() => {
    loadData()
  }, [id])

  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, submissionsRes, reportsRes] = await Promise.all([
        client.get(`/teachers/assignments/${id}/stats`).catch((err) => {
          console.error('获取统计数据失败:', err.response?.status, err.response?.data)
          throw err
        }),
        client.get(`/teachers/assignments/${id}/submissions`).catch((err) => {
          console.error('获取提交列表失败:', err.response?.status, err.response?.data)
          throw err
        }),
        client.get(`/teachers/assignments/${id}/class-reports`).catch(() => ({ data: { reports: [] } }))
      ])
      setStats(statsRes.data)
      setSubmissions(submissionsRes.data)
      setHasReports((reportsRes.data.reports || []).length > 0)
    } catch (err: any) {
      console.error('加载数据失败:', err)
      const errorMsg = err.response?.data?.detail || err.message || '加载数据失败，请检查网络连接或稍后重试'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    const taskId = `download-excel-${id}-${Date.now()}`
    setDownloading(true)
    addBackgroundTask(taskId)

    try {
      const response = await client.get(`/teachers/assignments/${id}/download-excel`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `作业分析汇总.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error: any) {
      console.error('下载失败:', error)
      alert(error.response?.data?.detail || '下载失败')
    } finally {
      setDownloading(false)
      removeBackgroundTask(taskId)
    }
  }

  const handlePublishReports = async () => {
    try {
      await client.post(`/teachers/assignments/${id}/publish-reports`)
      alert('报告已发布给学生')
      loadData()
    } catch (error) {
      console.error('发布失败:', error)
      alert('发布失败')
    }
  }

  const handleViewExcel = () => {
    window.open(`/teacher/assignments/${id}/excel`, '_blank')
  }

  const handleGenerateClassReport = async () => {
    if (!confirm('确定要生成全班学情报告吗？这将汇总所有学生的批改报告并生成综合分析。')) {
      return
    }

    const taskId = `generate-report-${id}-${Date.now()}`
    setGeneratingReport(true)
    addBackgroundTask(taskId)

    try {
      await client.post(`/teachers/assignments/${id}/generate-class-report`)
      setHasReports(true)
      alert('全班学情报告生成成功！')
      loadData().catch(console.error)
    } catch (error: any) {
      console.error('生成报告失败:', error)
      alert(error.response?.data?.detail || '生成报告失败')
    } finally {
      setGeneratingReport(false)
      removeBackgroundTask(taskId)
    }
  }

  const handleViewClassReport = () => {
    window.open(`/teacher/assignments/${id}/class-report`, '_blank')
  }

  const handleViewHomework = async (submissionId: number) => {
    const taskId = `load-homework-${submissionId}-${Date.now()}`
    setLoadingHomework(submissionId)
    addBackgroundTask(taskId)

    try {
      const response = await client.get(
        `/teachers/assignments/${id}/submissions/${submissionId}/homework`,
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error: any) {
      console.error('加载作业失败:', error)
      alert(error.response?.data?.detail || '加载作业失败')
    } finally {
      setLoadingHomework(null)
      removeBackgroundTask(taskId)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary-600 h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">加载失败</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button className="btn btn-primary" onClick={loadData}>重试</button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to={`/teacher/assignments/${id}`} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">学情分析报告</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary gap-2" onClick={handleViewExcel}>
            <FileText size={16} />
            在线 Excel
          </button>
          <button className="btn btn-secondary gap-2" onClick={handleDownloadExcel} disabled={downloading}>
            {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            下载 Excel
          </button>
          <button className="btn btn-secondary gap-2" onClick={handleGenerateClassReport} disabled={generatingReport}>
            {generatingReport ? <Loader2 className="animate-spin" size={16} /> : <BarChart2 size={16} />}
            生成全班报告
          </button>
          {hasReports && (
            <button className="btn btn-secondary gap-2" onClick={handleViewClassReport}>
              <Eye size={16} />
              查看全班报告
            </button>
          )}
          <button className="btn btn-primary gap-2" onClick={handlePublishReports}>
            <CheckCircle2 size={16} />
            发布给学生
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">总学生数</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_students}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">已提交</p>
            <p className="text-2xl font-bold text-slate-900">{stats.submitted_count}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">提交率</p>
            <p className="text-2xl font-bold text-slate-900">{stats.submission_rate.toFixed(1)}%</p>
          </div>
        </div>
        {stats.average_grade && (
          <div className="card p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">平均等级</p>
              <p className="text-2xl font-bold text-slate-900">{stats.average_grade}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">等级分布</h2>
          <div className="space-y-4">
            {Object.entries(stats.grade_distribution).map(([grade, count]) => (
              <div key={grade} className="flex items-center text-sm">
                <span className="w-12 font-medium text-slate-700">{grade}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden mx-3">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / (stats.submitted_count || 1)) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Score Students */}
        {stats.low_score_students.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">需关注学生</h2>
            <div className="overflow-y-auto max-h-[300px] pr-2">
              <div className="space-y-2">
                {stats.low_score_students.map((s) => (
                  <div key={s.student_id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg text-red-800">
                    <span className="font-medium">{s.student_name}</span>
                    <span className="px-2 py-0.5 bg-white rounded text-xs font-bold border border-red-100">
                      等级: {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Stats Table */}
      {stats.question_stats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">题目统计分析</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium">题目</th>
                  <th className="px-6 py-3 font-medium text-center text-green-600">正确</th>
                  <th className="px-6 py-3 font-medium text-center text-yellow-600">部分正确</th>
                  <th className="px-6 py-3 font-medium text-center text-red-600">错误</th>
                  <th className="px-6 py-3 font-medium text-center">总数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.question_stats.map((q) => (
                  <tr key={q.key} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{q.key}</td>
                    <td className="px-6 py-4 text-center text-green-600 font-medium">{q.correct_count}</td>
                    <td className="px-6 py-4 text-center text-yellow-600 font-medium">{q.partial_count}</td>
                    <td className="px-6 py-4 text-center text-red-600 font-medium">{q.wrong_count}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{q.total_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">学生提交明细</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                  {sub.student_name[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{sub.student_name}</p>
                  <p className="text-xs text-slate-500">学号: {sub.student_id_str || sub.student_id}</p>
                </div>
                {sub.grade ? (
                  <span className={clsx(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    ["A", "A+"].includes(sub.grade) ? "bg-green-50 text-green-700 border-green-200" :
                    ["B", "B+"].includes(sub.grade) ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {sub.grade}
                  </span>
                ) : (
                  <span className={clsx(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    sub.status === 'processing' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    sub.status === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {sub.status === 'processing' ? '批改中' : sub.status === 'failed' ? '失败' : '待批改'}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {sub.homework_file_path && (
                  <button
                    className="btn btn-ghost text-xs px-3 h-8 gap-1"
                    onClick={() => handleViewHomework(sub.id)}
                    disabled={loadingHomework === sub.id}
                  >
                    {loadingHomework === sub.id ? <Loader2 className="animate-spin" size={12} /> : <FileText size={14} />}
                    查看原件
                  </button>
                )}
                {(sub.status === 'graded' || sub.report_file_path) && (
                  <Link 
                    to={`/teacher/assignments/${id}/submissions/${sub.id}/report`}
                    className="btn btn-secondary text-xs px-3 h-8 gap-1"
                  >
                    <FileText size={14} />
                    批改报告
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
