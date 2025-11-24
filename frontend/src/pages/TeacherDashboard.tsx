import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { Plus, Calendar, FileText, Loader2, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface Assignment {
  id: number
  title: string
  status: string
  created_at: string
  deadline?: string
}

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const response = await client.get('/assignments/')
      setAssignments(response.data)
    } catch (error) {
      console.error('加载作业失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      draft: { 
        text: '草稿', 
        className: 'bg-slate-100 text-slate-700 border-slate-200' 
      },
      published: { 
        text: '已发布', 
        className: 'bg-green-50 text-green-700 border-green-200' 
      },
      closed: { 
        text: '已关闭', 
        className: 'bg-red-50 text-red-700 border-red-200' 
      }
    }
    return map[status] || { text: status, className: 'bg-slate-100 text-slate-700' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的作业</h1>
          <p className="text-slate-500 mt-1">管理您发布的作业和查看学生提交情况</p>
        </div>
        <Link 
          to="/teacher/assignments/new" 
          className="btn btn-primary gap-2"
        >
          <Plus size={18} />
          创建新作业
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-600 h-8 w-8" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="card py-16 flex flex-col items-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">暂无作业</h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            您还没有创建任何作业。点击右上角的"创建新作业"按钮开始发布您的第一个作业。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const statusConfig = getStatusConfig(assignment.status)
            return (
              <div 
                key={assignment.id} 
                className="card hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
                onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      statusConfig.className
                    )}>
                      {statusConfig.text}
                    </span>
                    {assignment.deadline && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                        <Calendar size={12} />
                        {new Date(assignment.deadline).toLocaleDateString('zh-CN')} 截止
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {assignment.title}
                  </h3>
                  
                  <div className="mt-4 flex items-center text-sm text-slate-500">
                    <Calendar size={14} className="mr-1.5" />
                    <span>创建于 {new Date(assignment.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-xl flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-primary-600">查看详情</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
