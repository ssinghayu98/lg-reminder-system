import api from './api'
import type { ApiResponse, PagedResponse, Employee } from '@/types'

export const employeeService = {
  create: (data: any) => api.post<ApiResponse<Employee>>('/employees', data).then(r => r.data),
  update: (id: number, data: any) => api.put<ApiResponse<Employee>>(`/employees/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/employees/${id}`).then(r => r.data),
  getById: (id: number) => api.get<ApiResponse<Employee>>(`/employees/${id}`).then(r => r.data),
  getAll: (page = 0, size = 20, search?: string) =>
    api.get<ApiResponse<PagedResponse<Employee>>>('/employees', { params: { page, size, search } }).then(r => r.data),
  getByDepartment: (deptId: number, page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<Employee>>>(`/employees/department/${deptId}`, { params: { page, size } }).then(r => r.data),
  toggleStatus: (id: number) => api.patch(`/employees/${id}/toggle-status`).then(r => r.data),
  getStats: () => api.get<ApiResponse<Record<string, number>>>('/employees/stats').then(r => r.data),
  bulkImport: (rows: any[]) => api.post<ApiResponse<Employee[]>>('/employees/bulk-import', rows).then(r => r.data),
}
