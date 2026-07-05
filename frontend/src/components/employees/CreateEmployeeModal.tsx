import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { employeeService } from '@/services/employee.service'
import { departmentService } from '@/services/department.service'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Please select a department'),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CreateEmployeeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.getAll() })
  const departments = (deptData?.data as any[]) ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: any) => employeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] })
      onClose()
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, departmentId: Number(data.departmentId) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">Add new employee</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {(mutation.error as any)?.response?.data?.message ?? 'Failed to create employee'}
            </div>
          )}
          {[
            { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'John Doe', required: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com', required: true },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
            { name: 'designation', label: 'Designation', type: 'text', placeholder: 'Software Engineer' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1.5">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </label>
              <input {...register(field.name as any)} type={field.type} placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors[field.name as keyof FormData] && (
                <p className="mt-1 text-xs text-destructive">{errors[field.name as keyof FormData]?.message as string}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">Department <span className="text-destructive">*</span></label>
            <select {...register('departmentId')}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select department</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.departmentId && <p className="mt-1 text-xs text-destructive">{errors.departmentId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Joining date</label>
            <input {...register('joiningDate')} type="date"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-input text-sm hover:bg-accent">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Adding...' : 'Add employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
