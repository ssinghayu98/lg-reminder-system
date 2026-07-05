import api from './api'
import type { ApiResponse, AdminStats } from '@/types'

export const reportService = {
  getDashboardStats: () => api.get<ApiResponse<AdminStats>>('/reports/dashboard').then(r => r.data),
  downloadTaskExcel: () => api.get('/reports/tasks/excel', { responseType: 'blob' }).then(r => r.data),
  downloadEmployeeExcel: () => api.get('/reports/employees/excel', { responseType: 'blob' }).then(r => r.data),
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}
