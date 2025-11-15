import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import ReactMarkdown from 'react-markdown'
import '../index.css'

interface Report {
  timestamp: string
  created_at: string
  filename: string
}

export default function ClassReportView() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const timestamp = searchParams.get('timestamp')
  
  const [reports, setReports] = useState<Report[]>([])
  const [reportContent, setReportContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReports()
  }, [id])

  useEffect(() => {
    if (timestamp) {
      loadReport(timestamp)
    } else {
      loadLatestReport()
    }
  }, [id, timestamp])

  const loadReports = async () => {
    try {
      const response = await client.get(`/teachers/assignments/${id}/class-reports`)
      setReports(response.data.reports || [])
    } catch (error: any) {
      console.error('加载报告列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLatestReport = async () => {
    setLoadingReport(true)
    setError('')
    try {
      const response = await client.get(`/teachers/assignments/${id}/class-report`)
      setReportContent(response.data.content)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('报告尚未生成，请先生成报告')
      } else {
        setError('加载报告失败')
      }
    } finally {
      setLoadingReport(false)
    }
  }

  const loadReport = async (ts: string) => {
    setLoadingReport(true)
    setError('')
    try {
      const response = await client.get(`/teachers/assignments/${id}/class-report?timestamp=${ts}`)
      setReportContent(response.data.content)
    } catch (error: any) {
      setError('加载报告失败')
    } finally {
      setLoadingReport(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>全班学情分析报告</h1>
        </div>
      </header>
      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary">返回学情统计</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          {/* 历史报告列表 */}
          <div className="card">
            <h2 style={{ marginBottom: '16px' }}>历史报告</h2>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : reports.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                暂无历史报告
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {reports.map((report) => (
                  <div
                    key={report.timestamp}
                    onClick={() => {
                      setSearchParams({ timestamp: report.timestamp })
                      loadReport(report.timestamp)
                    }}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      border: timestamp === report.timestamp ? '2px solid #007bff' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: timestamp === report.timestamp ? '#e7f3ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (timestamp !== report.timestamp) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (timestamp !== report.timestamp) {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {formatDate(report.created_at)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {report.timestamp === reports[0]?.timestamp && (
                        <span style={{ color: '#28a745' }}>最新</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 报告内容 */}
          <div className="card">
            {loadingReport ? (
              <div className="loading">加载报告内容中...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              <div style={{
                background: '#f5f5f5',
                padding: '20px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '800px',
                overflow: 'auto'
              }}>
                <ReactMarkdown>{reportContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

