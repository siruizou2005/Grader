import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import { useLoadingStore } from '../store/loadingStore'
import '../index.css'

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
      console.log('统计数据:', statsRes.data)
      console.log('提交列表:', submissionsRes.data)
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
      // 清理URL
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
    // 直接导航到新页面
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
      const response = await client.post(`/teachers/assignments/${id}/generate-class-report`)
      setHasReports(true)
      alert('全班学情报告生成成功！')
      // 重新加载报告列表（不阻塞页面）
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
    // 打开新页面查看报告
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
      // 创建blob URL并在新窗口打开
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      // 清理URL（可选，浏览器会在窗口关闭时自动清理）
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
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>学情分析报告</h1>
          </div>
        </header>
        <div className="container">
          <div className="card">
            <div className="error">{error}</div>
            <button className="btn btn-primary" onClick={loadData} style={{ marginTop: '12px' }}>
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>学情分析报告</h1>
          </div>
        </header>
        <div className="container">
          <div className="card">数据加载失败，请重试</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>学情分析报告</h1>
        </div>
      </header>
      <div className="container">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/teacher/assignments/${id}`} className="btn btn-secondary">返回</Link>
          <button className="btn btn-primary" onClick={handleViewExcel}>
            在线查看Excel
          </button>
          <button className="btn btn-primary" onClick={handleDownloadExcel} disabled={downloading}>
            {downloading ? '下载中...' : '下载Excel成绩总表'}
          </button>
          <button className="btn btn-primary" onClick={handleGenerateClassReport} disabled={generatingReport}>
            {generatingReport ? '生成中...' : '生成全班学情报告'}
          </button>
          {hasReports && (
            <button className="btn btn-primary" onClick={handleViewClassReport}>
              查看全班学情报告
            </button>
          )}
          <button className="btn btn-primary" onClick={handlePublishReports}>
            发布报告给学生
          </button>
        </div>

        <div className="card">
          <h2>整体统计</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.total_students}</div>
              <div style={{ color: '#666' }}>总学生数</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.submitted_count}</div>
              <div style={{ color: '#666' }}>已提交</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.submission_rate.toFixed(1)}%</div>
              <div style={{ color: '#666' }}>提交率</div>
            </div>
            {stats.average_grade && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>{stats.average_grade}</div>
                <div style={{ color: '#666' }}>平均等级</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>等级分布</h2>
          <div style={{ marginTop: '16px' }}>
            {Object.entries(stats.grade_distribution).map(([grade, count]) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ width: '60px' }}>{grade}</div>
                <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', marginLeft: '12px', marginRight: '12px' }}>
                  <div style={{
                    background: '#007bff',
                    height: '24px',
                    borderRadius: '4px',
                    width: `${(count / stats.submitted_count) * 100}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats.question_stats.length > 0 && (
          <div className="card">
            <h2>题目统计</h2>
            <div style={{ marginTop: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>题目</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>正确</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>部分正确</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>错误</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>总数</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.question_stats.map((q) => (
                    <tr key={q.key} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{q.key}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#28a745' }}>{q.correct_count}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#ffc107' }}>{q.partial_count}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#dc3545' }}>{q.wrong_count}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{q.total_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats.low_score_students.length > 0 && (
          <div className="card">
            <h2>关注学生</h2>
            <div style={{ marginTop: '16px' }}>
              {stats.low_score_students.map((s) => (
                <div key={s.student_id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {s.student_name} - 等级: {s.grade}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2>学生提交列表</h2>
          <div style={{ marginTop: '16px' }}>
            {submissions.map((sub) => (
              <div key={sub.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{sub.student_name}</strong> ({sub.student_id_str || sub.student_id})
                  {sub.grade && <span style={{ marginLeft: '12px', color: '#666' }}>等级: {sub.grade}</span>}
                  {!sub.grade && (
                    <span style={{
                      marginLeft: '12px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: sub.status === 'processing' ? '#cce5ff' : sub.status === 'failed' ? '#f8d7da' : '#e2e3e5',
                      color: sub.status === 'processing' ? '#004085' : sub.status === 'failed' ? '#721c24' : '#383d41'
                    }}>
                      {sub.status === 'processing' ? '批改中' : sub.status === 'failed' ? '批改失败' : sub.status === 'pending' ? '待批改' : sub.status}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {sub.homework_file_path && sub.homework_file_path.trim() !== '' && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleViewHomework(sub.id)}
                      disabled={loadingHomework === sub.id}
                    >
                      {loadingHomework === sub.id ? '加载中...' : '查看作业原件'}
                    </button>
                  )}
                  {(sub.status === 'graded' || sub.report_file_path) && (
                    <Link to={`/teacher/assignments/${id}/submissions/${sub.id}/report`} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      查看批改报告
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

