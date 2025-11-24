import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { Calendar, FileText, Loader2, ChevronRight, Clock } from 'lucide-react'

interface Assignment {
  id: number
  title: string
  deadline: string | null
  created_at: string
  status?: string // Optional, if API returns submission status
}

export default function StudentDashboard() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">待完成作业</h1>
        <p className="text-slate-500 mt-1">查看和提交您的作业任务</p>
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
          <p className="text-slate-500 mt-1">
            您当前没有需要完成的作业。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div 
              key={assignment.id} 
              className="card hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
              onClick={() => navigate(`/student/assignments/${assignment.id}`)}
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                    进行中
                  </span>
                  {assignment.deadline && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                      <Clock size={12} />
                      {new Date(assignment.deadline).toLocaleDateString('zh-CN')} 截止
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {assignment.title}
                </h3>
                
                <div className="mt-4 flex items-center text-sm text-slate-500">
                  <Calendar size={14} className="mr-1.5" />
                  <span>发布于 {new Date(assignment.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-xl flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-primary-600">去提交作业</span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
