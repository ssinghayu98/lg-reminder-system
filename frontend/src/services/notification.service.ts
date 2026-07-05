import api from './api'
import type { ApiResponse, Notification, PagedResponse } from '@/types'

export const notificationService = {
  getAll: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<Notification>>>('/notifications', { params: { page, size } }).then(r => r.data),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count').then(r => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/mark-all-read').then(r => r.data),
}
