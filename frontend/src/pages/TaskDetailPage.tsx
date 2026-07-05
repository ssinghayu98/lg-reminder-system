import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '@/services/task.service'
import { useAuthStore } from '@/store/auth.store'
import { format } from 'date-fns'
import {
  ArrowLeft, Calendar, User, Building2, Clock, CheckCircle2,
  Send, Loader2, AlertTriangle, BarChart2
} from 'lucide-react'
import type { TaskStatus, TaskPriority } from '@/types'

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}
const STATUS_STYLE: Record<TaskStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  AWAITING_REVIEW: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [comment, setComment] = useState('')
  const [progress, setProgress] = useState<number | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getById(Number(id)),
  })
  const task = data?.data

  const progressMutation = useMutation({
    mutationFn: (d: { comment: string; progressPercent?: number }) =>
      taskService.addProgress(Number(id), d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setComment('')
      setProgress('')
    }
  })

  const completeMutation = useMutation({
    mutationFn: () => taskService.complete(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', id] })
  })

  const handleSubmitProgress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    progressMutation.mutate({
      comment: comment.trim(),
      progressPercent: progress !== '' ? Number(progress) : undefined,
    })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-muted-foreground" size={28} />
    </div>
  )
  if (!task) return <div className="text-center py-20 text-muted-foreground">Task not found</div>

  const isOverdue = task.status === 'OVERDUE'
  const isCompleted = task.status === 'COMPLETED'
  const canUpdate = !isCompleted && !isOverdue || user?.role !== 'ROLE_EMPLOYEE'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/tasks')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to tasks
      </button>

      {/* Header card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl font-bold mb-2 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLE[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                  <AlertTriangle size={10} /> Overdue
                </span>
              )}
            </div>
          </div>
          {!isCompleted && !isOverdue && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex-shrink-0">
              {completeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Mark complete
            </button>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{task.description}</p>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <BarChart2 size={14} /> Progress
            </span>
            <span className="text-sm font-medium text-primary">{task.progressPercent ?? 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${task.progressPercent ?? 0}%` }}
            />
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: User, label: 'Assigned to', value: task.assignedTo?.user?.fullName ?? 'Unassigned' },
            { icon: User, label: 'Assigned by', value: task.assignedBy?.fullName ?? '—' },
            { icon: Building2, label: 'Department', value: task.department?.name ?? '—' },
            { icon: Clock, label: 'Est. hours', value: task.estimatedHours ? `${task.estimatedHours}h` : '—' },
            { icon: Calendar, label: 'Due date', value: format(new Date(task.dueDate), 'MMM d, yyyy') },
            { icon: Calendar, label: 'Reminder', value: task.reminderDate ? format(new Date(task.reminderDate), 'MMM d, yyyy') : '—' },
            { icon: Calendar, label: 'Created', value: format(new Date(task.createdAt), 'MMM d, yyyy') },
            { icon: Calendar, label: 'Completed', value: task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Icon size={12} /> {label}
              </div>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add progress update */}
      {canUpdate && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Add progress update</h3>
          <form onSubmit={handleSubmitProgress} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Describe what you've done, blockers, next steps..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">Progress %</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={progress}
                  onChange={e => setProgress(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0–100"
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!comment.trim() || progressMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {progressMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {progressMutation.isPending ? 'Saving...' : 'Submit update'}
            </button>
          </form>
        </div>
      )}

      {/* Update history */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Update history</h3>
        {!task.updates || task.updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No updates yet. Be the first to add one.</p>
        ) : (
          <div className="space-y-4">
            {task.updates.map(update => (
              <div key={update.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-medium">{update.updatedBy?.fullName?.charAt(0) ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{update.updatedBy?.fullName}</span>
                    {update.progressPercent != null && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {update.progressPercent}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{update.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
