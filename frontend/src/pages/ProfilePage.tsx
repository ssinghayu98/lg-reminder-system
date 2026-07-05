import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setError("New passwords don't match"); return }
    if (newPwd.length < 8) { setError("Password must be at least 8 characters"); return }
    try {
      setLoading(true); setError('')
      await authService.changePassword(currentPwd, newPwd)
      setSuccess(true); setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to change password')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* User info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-2xl font-bold">{user?.fullName?.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.fullName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full mt-1 inline-block">
              {user?.role?.replace('ROLE_', '').replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Full name', value: user?.fullName },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role?.replace('ROLE_', '').replace('_', ' ') },
            { label: 'Email verified', value: user?.emailVerified ? 'Yes' : 'No' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-medium">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Change password</h3>
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
            <CheckCircle size={14} /> Password changed successfully
          </div>
        )}
        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'Current password', value: currentPwd, onChange: setCurrentPwd },
            { label: 'New password', value: newPwd, onChange: setNewPwd },
            { label: 'Confirm new password', value: confirmPwd, onChange: setConfirmPwd },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type="password" value={value} onChange={e => onChange(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
