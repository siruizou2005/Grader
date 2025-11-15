import { create } from 'zustand'

interface LoadingState {
  // 全局loading状态（用于页面初始化）
  globalLoading: boolean
  // 后台任务loading状态（不影响页面显示）
  backgroundTasks: Set<string>
  
  setGlobalLoading: (loading: boolean) => void
  addBackgroundTask: (taskId: string) => void
  removeBackgroundTask: (taskId: string) => void
  hasBackgroundTasks: () => boolean
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  globalLoading: false,
  backgroundTasks: new Set(),
  
  setGlobalLoading: (loading: boolean) => {
    set({ globalLoading: loading })
  },
  
  addBackgroundTask: (taskId: string) => {
    const tasks = new Set(get().backgroundTasks)
    tasks.add(taskId)
    set({ backgroundTasks: tasks })
  },
  
  removeBackgroundTask: (taskId: string) => {
    const tasks = new Set(get().backgroundTasks)
    tasks.delete(taskId)
    set({ backgroundTasks: tasks })
  },
  
  hasBackgroundTasks: () => {
    return get().backgroundTasks.size > 0
  }
}))

