import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Notification } from '@/types'
import { useState } from 'react'

const TYPE_COLORS: Record<string, string> = {
  TASK_ASSIGNED: 'bg-blue-100 text-blue-700',
  TASK_UPDATED: 'bg-indigo-100 text-indigo-700',
  TASK_OVERDUE: 'bg-red-100 text-red-700',
  REMINDER_SENT: 'bg-yellow-100 text-yellow-700',
  TASK_COMPLETED: 'bg-green-100 text-green-700',
  ESCALATION: 'bg-orange-100 text-orange-700',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.getAll(page, 30),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    }
  })

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  const notifications = (data?.data as any)?.content ?? []
  const totalPages = (data?.data as any)?.totalPages ?? 0
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-input rounded-lg hover:bg-accent disabled:opacity-50">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bell size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {notifications.map((n: Notification) => (
            <div key={n.id}
              onClick={() => { if (!n.isRead) markOneMutation.mutate(n.id) }}
              className={`p-4 transition-colors cursor-pointer hover:bg-accent/50 ${!n.isRead ? 'bg-primary/5' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1.5 inline-block ${TYPE_COLORS[n.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {n.type?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm border ${page === i ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
