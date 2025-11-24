import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!inviteCode) {
      setError('请输入邀请码')
      return
    }

    if (role === 'student' && !studentId.trim()) {
      setError('学生注册必须提供学号')
      return
    }

    setLoading(true)

    try {
      await register(username, password, role, inviteCode, role === 'student' ? studentId : undefined)
      if (role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请检查输入信息')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-xl shadow-lg">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          创建新账号
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          加入 AI 作业批改助手，开启智能教学之旅
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                我是...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student')
                    setStudentId('')
                  }}
                  className={clsx(
                    "flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-all",
                    role === 'student'
                      ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  学生
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('teacher')
                    setStudentId('')
                  }}
                  className={clsx(
                    "flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-all",
                    role === 'teacher'
                      ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  教师
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {role === 'student' ? '真实姓名' : '用户名'}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full"
                  placeholder={role === 'student' ? "请输入您的姓名" : "请输入用户名"}
                />
              </div>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  学号
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="input w-full"
                    placeholder="请输入学号"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full"
                  placeholder="设置登录密码"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                邀请码
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="input w-full"
                  placeholder={role === 'teacher' ? "格式: teacher-班级ID" : "格式: student-班级ID"}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 flex items-start gap-1">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  教师邀请码格式: <code className="bg-slate-100 px-1 py-0.5 rounded">teacher-班级ID</code><br/>
                  学生邀请码格式: <code className="bg-slate-100 px-1 py-0.5 rounded">student-班级ID</code>
                </span>
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    注册中...
                  </>
                ) : (
                  '立即注册'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  已有账号？
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
