import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, CheckCircle, Mail } from 'lucide-react'
import api from '@/services/api'

interface CustomReminder {
  id: number
  email: string
  subject: string
  message: string
  scheduledAt: string
  sent: boolean
  sentAt?: string
  createdAt: string
}

const createReminder = (data: any) =>
  api.post('/custom-reminders', data).then(r => r.data)

const getReminders = () =>
  api.get<CustomReminder[]>('/custom-reminders').then(r => r.data)

export default function CustomReminderPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    email: '',
    subject: '',
    message: '',
    scheduledAt: '',
  })
  const [success, setSuccess] = useState(false)

  const { data: reminders = [] } = useQuery({
    queryKey: ['custom-reminders'],
    queryFn: getReminders,
  })

  const mutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reminders'] })
      setForm({ email: '', subject: '', message: '', scheduledAt: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Send as-is without UTC conversion to preserve local time
    const scheduledAt = form.scheduledAt.replace('T', 'T').slice(0, 19)
    mutation.mutate({ ...form, scheduledAt })
  }

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="text-primary" size={24} />
        <div>
          <h1 className="text-2xl font-bold">Custom Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Set a reminder for any email at any date and time
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus size={16} /> New Reminder
        </h2>
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle size={14} /> Reminder scheduled successfully!
          </div>
        )}
        {mutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            Failed to schedule reminder. Please try again.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Reminder subject"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Message <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Your reminder message..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Date & Time <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Scheduling...' : 'Schedule Reminder'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Mail size={16} /> Scheduled Reminders
        </h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No reminders scheduled yet
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r: CustomReminder) => (
              <div
                key={r.id}
                className={`p-3 rounded-lg border ${r.sent ? 'bg-green-50 border-green-200' : 'bg-background border-border'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium truncate">{r.subject}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.sent ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.sent ? 'Sent' : 'Pending'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(r.scheduledAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}