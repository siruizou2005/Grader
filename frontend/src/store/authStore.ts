import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

export interface User {
  id: number
  username: string
  role: 'teacher' | 'student'
  class_id: string
  student_id?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, role: 'teacher' | 'student', inviteCode: string, studentId?: string) => Promise<void>
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        })
      },
      login: async (username: string, password: string) => {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)
        
        const response = await axios.post('/api/auth/login', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        const { access_token, user } = response.data
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        
        set({
          user,
          token: access_token,
          isAuthenticated: true
        })
      },
      register: async (username: string, password: string, role: 'teacher' | 'student', inviteCode: string, studentId?: string) => {
        const response = await axios.post('/api/auth/register', {
          username,
          password,
          role,
          invite_code: inviteCode,
          student_id: studentId || null
        })
        
        const user = response.data
        set({ user })
        
        // 注册后自动登录
        await useAuthStore.getState().login(username, password)
      },
      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
        // 确保总是设置hasHydrated为true，即使state为null
        if (state) {
          state.setHasHydrated(true)
        } else {
          // 如果state为null，延迟设置以确保store已初始化
          setTimeout(() => {
            useAuthStore.getState().setHasHydrated(true)
          }, 0)
        }
      }
    }
  )
)

