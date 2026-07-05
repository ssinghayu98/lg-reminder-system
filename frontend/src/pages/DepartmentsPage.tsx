import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentService } from '@/services/department.service'
import { Plus, Building2, Users, Pencil, Trash2, Loader2, X } from 'lucide-react'
import type { Department } from '@/types'

export default function DepartmentsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data, isLoading } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.getAll() })
  const departments = (data?.data as Department[]) ?? []

  const createMutation = useMutation({
    mutationFn: (d: any) => departmentService.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setShowCreate(false); setForm({ name:'',description:'' }) }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => departmentService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setEditDept(null) }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  })

  const DEPT_ICONS = ['HR','Sales','Marketing','IT','Finance']
  const DEPT_COLORS = ['bg-purple-500','bg-blue-500','bg-pink-500','bg-green-500','bg-orange-500']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{departments.length} departments</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> New department
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, idx) => (
            <div key={dept.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${DEPT_COLORS[idx % DEPT_COLORS.length]} flex items-center justify-center`}>
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditDept(dept); setForm({ name: dept.name, description: dept.description ?? '' }) }}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(dept.id)} disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{dept.name}</h3>
              {dept.description && <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>}
              {dept.manager && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <Users size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Manager: {dept.manager.fullName}</span>
                </div>
              )}
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-2 ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editDept) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreate(false); setEditDept(null) }} />
          <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editDept ? 'Edit department' : 'New department'}</h2>
              <button onClick={() => { setShowCreate(false); setEditDept(null) }} className="p-1.5 rounded-lg hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. IT"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowCreate(false); setEditDept(null) }}
                  className="flex-1 py-2 rounded-lg border border-input text-sm hover:bg-accent">Cancel</button>
                <button
                  onClick={() => editDept
                    ? updateMutation.mutate({ id: editDept.id, data: form })
                    : createMutation.mutate(form)
                  }
                  disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editDept ? 'Save changes' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
