import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Loader2, CheckCircle } from 'lucide-react'
import { authService } from '@/services/auth.service'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    const token = params.get('token') || ''
    try { setLoading(true); await authService.resetPassword(token, password); setDone(true) }
    catch (err: any) { setError(err.response?.data?.message || 'Reset failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {done ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Password reset!</h2>
            <p className="text-muted-foreground text-sm mb-4">Your password has been updated.</p>
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Go to login</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">Reset password</h2>
            {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm new password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />} Reset password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
