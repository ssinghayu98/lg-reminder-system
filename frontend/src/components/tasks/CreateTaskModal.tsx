import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { taskService } from '@/services/task.service'
import { employeeService } from '@/services/employee.service'
import { departmentService } from '@/services/department.service'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToEmployeeId: z.string().min(1, 'Please select an employee'),
  departmentId: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  reminderDate: z.string().optional(),
  estimatedHours: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeeService.getAll(0, 100) })
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.getAll() })
  const employees = empData?.data?.content ?? []
  const departments = (deptData?.data as any[]) ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' }
  })

  const mutation = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      onClose()
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      assignedToEmployeeId: Number(data.assignedToEmployeeId),
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">Create new task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {(mutation.error as any)?.response?.data?.message ?? 'Failed to create task'}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Title <span className="text-destructive">*</span></label>
            <input {...register('title')} placeholder="Enter task title"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Describe the task..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select {...register('priority')}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Department</label>
              <select {...register('departmentId')}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">None</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Assign to <span className="text-destructive">*</span></label>
            <select {...register('assignedToEmployeeId')}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select employee</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.user?.fullName} ({e.department?.name ?? 'No dept'})</option>
              ))}
            </select>
            {errors.assignedToEmployeeId && <p className="mt-1 text-xs text-destructive">{errors.assignedToEmployeeId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Due date <span className="text-destructive">*</span></label>
              <input {...register('dueDate')} type="date" min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.dueDate && <p className="mt-1 text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reminder date</label>
              <input {...register('reminderDate')} type="date" min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Estimated hours</label>
            <input {...register('estimatedHours')} type="number" min="1" placeholder="e.g. 8"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-input text-sm hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
