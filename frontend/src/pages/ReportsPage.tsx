import { useQuery } from '@tanstack/react-query'
import { reportService, downloadBlob } from '@/services/report.service'
import { taskService } from '@/services/task.service'
import { employeeService } from '@/services/employee.service'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6']

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const { data: dashData } = useQuery({ queryKey: ['report-dashboard'], queryFn: () => reportService.getDashboardStats() })
  const { data: taskStatsData } = useQuery({ queryKey: ['task-stats'], queryFn: () => taskService.getStats() })
  const { data: empStatsData } = useQuery({ queryKey: ['emp-stats'], queryFn: () => employeeService.getStats() })

  const stats = dashData?.data
  const taskStats = taskStatsData?.data
  const empStats = empStatsData?.data

  const taskBarData = taskStats ? [
    { name: 'Pending', value: taskStats.pending ?? 0 },
    { name: 'In Progress', value: taskStats.inProgress ?? 0 },
    { name: 'Review', value: taskStats.awaitingReview ?? 0 },
    { name: 'Completed', value: taskStats.completed ?? 0 },
    { name: 'Overdue', value: taskStats.overdue ?? 0 },
  ] : []

  const empPieData = empStats ? [
    { name: 'Active', value: empStats.active ?? 0 },
    { name: 'Inactive', value: empStats.inactive ?? 0 },
    { name: 'On Leave', value: empStats.onLeave ?? 0 },
  ].filter(d => d.value > 0) : []

  const handleDownload = async (type: 'tasks' | 'employees') => {
    try {
      setDownloading(type)
      const blob = type === 'tasks'
        ? await reportService.downloadTaskExcel()
        : await reportService.downloadEmployeeExcel()
      downloadBlob(blob, `${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (e) {
      console.error('Download failed', e)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of system performance and metrics</p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total employees', value: stats.totalEmployees },
            { label: 'Active employees', value: stats.activeEmployees },
            { label: 'Total tasks', value: stats.totalTasks },
            { label: 'Overdue tasks', value: stats.overdueTasks },
            { label: 'Completed tasks', value: stats.completedTasks },
            { label: 'Pending tasks', value: stats.pendingTasks },
            { label: 'Reminders sent', value: stats.remindersSent },
            { label: 'Reminders failed', value: stats.remindersFailed },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Task status breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taskBarData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Employee status distribution</h3>
          {empPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={empPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {empPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">No employee data</div>
          )}
        </div>
      </div>

      {/* Reminder metrics */}
      {stats && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Reminder system metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total sent', value: stats.remindersSent, color: 'bg-green-500' },
              { label: 'Failed', value: stats.remindersFailed, color: 'bg-red-500' },
              { label: 'Success rate', value: stats.remindersSent > 0 ? `${Math.round((stats.remindersSent / (stats.remindersSent + stats.remindersFailed)) * 100)}%` : '—', color: 'bg-blue-500' },
              { label: 'Overdue tasks', value: stats.overdueTasks, color: 'bg-orange-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/40 rounded-lg p-4">
                <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export section */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Export reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'tasks', label: 'Task report', desc: 'All tasks with status, priority, assignees, and progress' },
            { id: 'employees', label: 'Employee report', desc: 'All employees with task counts and performance metrics' },
          ].map(({ id, label, desc }) => (
            <div key={id} className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(id as 'tasks' | 'employees')}
                disabled={downloading === id}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-lg hover:bg-accent disabled:opacity-50 flex-shrink-0">
                {downloading === id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Excel
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
