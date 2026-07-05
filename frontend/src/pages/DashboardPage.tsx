import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { reportService } from '@/services/report.service'
import { taskService } from '@/services/task.service'
import { employeeService } from '@/services/employee.service'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  CheckSquare, Users, AlertTriangle, Clock, TrendingUp,
  Bell, Calendar, ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: any; color: string; sub?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ROLE_SUPER_ADMIN'
  const isManager = user?.role === 'ROLE_MANAGER' || isAdmin

  const { data: statsData } = useQuery({
    queryKey: ['report-dashboard'],
    queryFn: () => reportService.getDashboardStats(),
    enabled: isManager,
  })

  const { data: taskStatsData } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => taskService.getStats(),
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => taskService.getUpcoming(7),
  })

  const { data: empStatsData } = useQuery({
    queryKey: ['emp-stats'],
    queryFn: () => employeeService.getStats(),
    enabled: isManager,
  })

  const stats = statsData?.data
  const taskStats = taskStatsData?.data
  const upcoming = upcomingData?.data ?? []
  const empStats = empStatsData?.data

  const taskPieData = taskStats ? [
    { name: 'Pending', value: taskStats.pending ?? 0 },
    { name: 'In Progress', value: taskStats.inProgress ?? 0 },
    { name: 'Completed', value: taskStats.completed ?? 0 },
    { name: 'Overdue', value: taskStats.overdue ?? 0 },
    { name: 'Awaiting Review', value: taskStats.awaitingReview ?? 0 },
  ].filter(d => d.value > 0) : []

  const barData = [
    { name: 'Pending', tasks: taskStats?.pending ?? 0 },
    { name: 'In Progress', tasks: taskStats?.inProgress ?? 0 },
    { name: 'Review', tasks: taskStats?.awaitingReview ?? 0 },
    { name: 'Completed', tasks: taskStats?.completed ?? 0 },
    { name: 'Overdue', tasks: taskStats?.overdue ?? 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Admin/Manager stats */}
      {isManager && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total employees" value={stats.totalEmployees} icon={Users} color="bg-blue-500" sub={`${stats.activeEmployees} active`} />
          <StatCard label="Total tasks" value={stats.totalTasks} icon={CheckSquare} color="bg-indigo-500" />
          <StatCard label="Overdue tasks" value={stats.overdueTasks} icon={AlertTriangle} color="bg-red-500" />
          <StatCard label="Reminders sent" value={stats.remindersSent} icon={Bell} color="bg-green-500" sub={`${stats.remindersFailed} failed`} />
        </div>
      )}

      {/* Task stats for all roles */}
      {taskStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total tasks" value={taskStats.total ?? 0} icon={CheckSquare} color="bg-primary" />
          <StatCard label="In progress" value={taskStats.inProgress ?? 0} icon={Clock} color="bg-indigo-500" />
          <StatCard label="Completed" value={taskStats.completed ?? 0} icon={TrendingUp} color="bg-green-500" />
          <StatCard label="Overdue" value={taskStats.overdue ?? 0} icon={AlertTriangle} color="bg-red-500" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Task overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Task distribution</h3>
          {taskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {taskPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No task data yet</div>
          )}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar size={16} /> Upcoming deadlines (next 7 days)
          </h3>
          <button onClick={() => navigate('/tasks')} className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines in the next 7 days.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map(task => {
              const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000)
              return (
                <div key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'CRITICAL' ? 'bg-red-500' :
                    task.priority === 'HIGH' ? 'bg-orange-500' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assignedTo?.user?.fullName ?? 'Unassigned'} · {task.department?.name ?? ''}
                    </p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                    daysLeft <= 1 ? 'bg-red-100 text-red-700' :
                    daysLeft <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
