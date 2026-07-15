import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, Role } from '@/types'

interface AuthState {
  user: Omit<AuthResponse, 'accessToken' | 'refreshToken' | 'tokenType'> | null
  isAuthenticated: boolean
  setAuth: (data: AuthResponse) => void
  clearAuth: () => void
  hasRole: (role: Role) => boolean
  isSuperAdmin: () => boolean
  isManager: () => boolean
  isEmployee: () => boolean
}

// Since zustand/middleware may not be installed by default, we use a simple store
let authState: AuthState['user'] = null
try {
  const stored = localStorage.getItem('user')
  if (stored) authState = JSON.parse(stored)
} catch {}

type SetState = (fn: (state: AuthState) => Partial<AuthState>) => void
type GetState = () => AuthState

const createAuthStore = (set: SetState, get: GetState): AuthState => ({
  user: authState,
  isAuthenticated: !!authState,

  setAuth: (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const user = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      emailVerified: data.emailVerified,
    }
    localStorage.setItem('user', JSON.stringify(user))
    set(() => ({ user, isAuthenticated: true }))
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set(() => ({ user: null, isAuthenticated: false }))
  },

  hasRole: (role: Role) => get().user?.role === role,
  isSuperAdmin: () => get().user?.role === 'ROLE_SUPER_ADMIN',
  isManager: () => get().user?.role === 'ROLE_MANAGER' || get().user?.role === 'ROLE_SUPER_ADMIN',
  isEmployee: () => !!get().user,
})

// Simple vanilla store without zustand dependency issues
class AuthStore {
  private state: AuthState
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.state = createAuthStore(
      (fn) => {
        const updates = fn(this.state)
        this.state = { ...this.state, ...updates }
        this.listeners.forEach(l => l())
      },
      () => this.state
    )
  }

  getState() { return this.state }
 subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

export const authStore = new AuthStore()

import { useState, useEffect } from 'react'

export function useAuthStore() {
  const [state, setState] = useState(authStore.getState())
  useEffect(() => {
    return authStore.subscribe(() => setState({ ...authStore.getState() }))
  }, [])
  return state
}
