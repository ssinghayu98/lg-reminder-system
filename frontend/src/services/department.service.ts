import api from './api'
import type { ApiResponse, Department } from '@/types'

export const departmentService = {
  create: (data: any) => api.post<ApiResponse<Department>>('/departments', data).then(r => r.data),
  update: (id: number, data: any) => api.put<ApiResponse<Department>>(`/departments/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/departments/${id}`).then(r => r.data),
  getById: (id: number) => api.get<ApiResponse<Department>>(`/departments/${id}`).then(r => r.data),
  getAll: () => api.get<ApiResponse<Department[]>>('/departments').then(r => r.data),
  getStats: (id: number) => api.get<ApiResponse<Record<string, any>>>(`/departments/${id}/stats`).then(r => r.data),
}
