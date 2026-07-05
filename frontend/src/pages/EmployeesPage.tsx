import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employee.service'
import { useAuthStore } from '@/store/auth.store'
import { Plus, Search, Loader2, UserCheck, UserX, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import type { Employee } from '@/types'
import CreateEmployeeModal from '@/components/employees/CreateEmployeeModal'

export default function EmployeesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'ROLE_SUPER_ADMIN'
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () => employeeService.getAll(page, 20, search),
  })

  const { data: statsData } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => employeeService.getStats(),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => employeeService.toggleStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setConfirmDelete(null)
    },
  })

  const employees = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const stats = statsData?.data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.data?.totalElements ?? 0} total employees</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Add employee
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-500' },
            { label: 'Active', value: stats.active, color: 'bg-green-500' },
            { label: 'Inactive', value: stats.inactive, color: 'bg-gray-400' },
            { label: 'On Leave', value: stats.onLeave, color: 'bg-yellow-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
              <p className="text-xl font-bold">{value ?? 0}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search employees..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Employee', 'Code', 'Department', 'Designation', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-medium">{emp.user?.fullName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{emp.user?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{emp.employeeCode ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.department?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.designation ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        emp.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {emp.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => toggleMutation.mutate(emp.id)}
                              disabled={toggleMutation.isPending}
                              title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                              {emp.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(emp.id)}
                              title="Delete employee"
                              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Delete employee</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-input text-sm hover:bg-accent">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 flex items-center justify-center gap-2 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
