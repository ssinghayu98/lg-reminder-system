import api from './api'
import type { ApiResponse, PagedResponse, Task, TaskUpdate } from '@/types'

export const taskService = {
  create: (data: any) => api.post<ApiResponse<Task>>('/tasks', data).then(r => r.data),
  update: (id: number, data: any) => api.put<ApiResponse<Task>>(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tasks/${id}`).then(r => r.data),
  getById: (id: number) => api.get<ApiResponse<Task>>(`/tasks/${id}`).then(r => r.data),
  getAll: (page = 0, size = 20, sortBy?: string) =>
    api.get<ApiResponse<PagedResponse<Task>>>('/tasks', { params: { page, size, sortBy } }).then(r => r.data),
  getForEmployee: (employeeId: number, page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<Task>>>(`/tasks/employee/${employeeId}`, { params: { page, size } }).then(r => r.data),
  addProgress: (id: number, data: { comment: string; progressPercent?: number }) =>
    api.post<ApiResponse<TaskUpdate>>(`/tasks/${id}/progress`, data).then(r => r.data),
  complete: (id: number) => api.post<ApiResponse<Task>>(`/tasks/${id}/complete`).then(r => r.data),
  getStats: () => api.get<ApiResponse<Record<string, number>>>('/tasks/stats').then(r => r.data),
  getUpcoming: (days = 7) => api.get<ApiResponse<Task[]>>('/tasks/upcoming', { params: { days } }).then(r => r.data),
}
