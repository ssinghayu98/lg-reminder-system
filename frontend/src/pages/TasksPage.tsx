import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { taskService } from '@/services/task.service'
import { useAuthStore } from '@/store/auth.store'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, Loader2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
  AWAITING_REVIEW: 'Awaiting Review', COMPLETED: 'Completed', OVERDUE: 'Overdue', CANCELLED: 'Cancelled'
}
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical'
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cls = {
    LOW: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }[priority]
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{PRIORITY_LABELS[priority]}</span>
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cls = {
    PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    ASSIGNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    AWAITING_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    CANCELLED: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }[status]
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{STATUS_LABELS[status]}</span>
}

export default function TasksPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isManager = user?.role === 'ROLE_SUPER_ADMIN' || user?.role === 'ROLE_MANAGER'

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, statusFilter, priorityFilter],
    queryFn: () => taskService.getAll(page, 20),
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => taskService.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.user?.fullName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || t.status === statusFilter
    const matchPriority = !priorityFilter || t.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.data?.totalElements ?? 0} total tasks
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} /> New task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or assignees..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Task</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned to</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((task: Task) => {
                  const isOverdue = task.status === 'OVERDUE'
                  const dueDate = new Date(task.dueDate)
                  return (
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium text-foreground ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {task.title}
                          </p>
                          {task.department && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.department.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs">{task.assignedTo?.user?.fullName?.charAt(0) ?? '?'}</span>
                          </div>
                          <span className="text-muted-foreground">{task.assignedTo?.user?.fullName ?? 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className={`px-4 py-3 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {format(dueDate, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[60px]">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${task.progressPercent ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{task.progressPercent ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/tasks/${task.id}`)}
                            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                            <Eye size={14} />
                          </button>
                          {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                            <button
                              onClick={() => completeMutation.mutate(task.id)}
                              disabled={completeMutation.isPending}
                              className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-muted-foreground hover:text-green-600"
                              title="Mark complete"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
