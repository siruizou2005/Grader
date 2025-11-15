import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import '../index.css'

export default function ExcelView() {
  const { id } = useParams<{ id: string }>()
  const [excelData, setExcelData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadExcelData()
  }, [id])

  const loadExcelData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await client.get(`/teachers/assignments/${id}/excel`)
      if (response.data.success && response.data.data) {
        // 只使用汇总(宽表)数据
        const wideData = response.data.data['汇总(宽表)'] || []
        setExcelData(wideData)
      } else {
        setError('数据格式错误')
      }
    } catch (err: any) {
      console.error('加载表格数据失败:', err)
      setError(err.response?.data?.detail || '加载表格数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>Excel数据查看</h1>
          </div>
        </header>
        <div className="container">
          <div className="card">
            <div className="error">{error}</div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={loadExcelData}>重试</button>
              <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary">返回</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!excelData || excelData.length === 0) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>Excel数据查看</h1>
          </div>
        </header>
        <div className="container">
          <div className="card">
            <p>暂无数据</p>
            <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary" style={{ marginTop: '12px' }}>
              返回
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 获取所有列名
  const columns = excelData.length > 0 ? Object.keys(excelData[0]) : []

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>成绩汇总表</h1>
          <div className="header-actions">
            <Link to={`/teacher/assignments/${id}/stats`} className="btn btn-secondary">返回</Link>
          </div>
        </div>
      </header>
      <div className="container">
        <div className="card">
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>汇总(宽表)</h2>
            <div style={{ fontSize: '14px', color: '#666' }}>
              共 {excelData.length} 条记录
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '14px',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ background: '#f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
                  {columns.map((key) => (
                    <th 
                      key={key} 
                      style={{ 
                        padding: '10px 8px', 
                        border: '1px solid #ddd', 
                        textAlign: 'left',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row: any, idx: number) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}
                  >
                    {columns.map((key) => {
                      const value = row[key] || ''
                      // 根据列名设置样式
                      let cellStyle: React.CSSProperties = {
                        padding: '8px',
                        border: '1px solid #ddd',
                        whiteSpace: 'nowrap'
                      }
                      
                      // 如果是等级列，添加颜色
                      if (key === 'grade') {
                        if (value === 'A+' || value === 'A') {
                          cellStyle.color = '#28a745'
                          cellStyle.fontWeight = 'bold'
                        } else if (value === 'B+' || value === 'B') {
                          cellStyle.color = '#17a2b8'
                        } else if (value === 'C+' || value === 'C' || value === 'C-') {
                          cellStyle.color = '#ffc107'
                        } else if (value === 'D' || value === 'F') {
                          cellStyle.color = '#dc3545'
                        }
                      }
                      
                      // 如果是状态列，添加颜色
                      if (key.startsWith('Q:')) {
                        if (value === '正确') {
                          cellStyle.color = '#28a745'
                        } else if (value === '过程部分正确') {
                          cellStyle.color = '#ffc107'
                        } else if (value === '错误') {
                          cellStyle.color = '#dc3545'
                        }
                      }
                      
                      return (
                        <td key={key} style={cellStyle}>
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

