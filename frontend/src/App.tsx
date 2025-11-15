import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import CreateAssignment from './pages/CreateAssignment'
import AssignmentDetail from './pages/AssignmentDetail'
import AssignmentStats from './pages/AssignmentStats'
import StudentAssignmentDetail from './pages/StudentAssignmentDetail'
import StudentReportView from './pages/StudentReportView'
import ExcelView from './pages/ExcelView'
import ClassReportView from './pages/ClassReportView'
import './App.css'

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'teacher' | 'student' }) {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />
  }
  
  return <>{children}</>
}

function App() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated)
  
  useEffect(() => {
    // 如果还没有 hydrated，设置一个 fallback（最多等待500ms）
    if (!hasHydrated) {
      const timer = setTimeout(() => {
        setHasHydrated(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasHydrated, setHasHydrated])
  
  // 在 hydration 完成前显示加载状态
  if (!hasHydrated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>加载中...</div>
      </div>
    )
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          isAuthenticated ? (
            user?.role === 'teacher' ? (
              <Navigate to="/teacher" />
            ) : (
              <Navigate to="/student" />
            )
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/teacher" element={
          <PrivateRoute requiredRole="teacher">
            <TeacherDashboard />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/new" element={
          <PrivateRoute requiredRole="teacher">
            <CreateAssignment />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/:id" element={
          <PrivateRoute requiredRole="teacher">
            <AssignmentDetail />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/:id/stats" element={
          <PrivateRoute requiredRole="teacher">
            <AssignmentStats />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/:id/submissions/:submissionId/report" element={
          <PrivateRoute requiredRole="teacher">
            <StudentReportView />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/:id/excel" element={
          <PrivateRoute requiredRole="teacher">
            <ExcelView />
          </PrivateRoute>
        } />
        <Route path="/teacher/assignments/:id/class-report" element={
          <PrivateRoute requiredRole="teacher">
            <ClassReportView />
          </PrivateRoute>
        } />
        <Route path="/student" element={
          <PrivateRoute requiredRole="student">
            <StudentDashboard />
          </PrivateRoute>
        } />
        <Route path="/student/assignments/:id" element={
          <PrivateRoute requiredRole="student">
            <StudentAssignmentDetail />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

