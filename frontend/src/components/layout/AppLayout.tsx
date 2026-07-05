import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CheckSquare, Users, Building2,
  BarChart3, Bell, User, LogOut, Menu, X, Moon, Sun, ChevronDown,
  Clock
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['ROLE_SUPER_ADMIN'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reminders', icon: Clock, label: 'Reminders' },
]

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.data?.count ?? 0

  const handleLogout = () => {
    authService.logout()
    clearAuth()
    navigate('/login')
  }

  const toggleDark = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role ?? '')
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-card border-r border-border flex flex-col`}>
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">LG</span>
          </div>
          {sidebarOpen && <span className="font-semibold text-sm truncate">Reminder System</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative group ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {label === 'Notifications' && unreadCount > 0 && (
                <span className={`${sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1'} text-xs font-medium px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {!sidebarOpen && (
                <span className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-border">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium text-sm">{user?.fullName?.charAt(0) ?? 'U'}</span>
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.role?.replace('ROLE_', '').replace('_', ' ')}</p>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 w-48 mb-1 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                <button onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"><User size={14} /> Profile</button>
                <button onClick={toggleDark}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                  {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}
                </button>
                <div className="border-t border-border my-1" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-accent transition-colors">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-accent">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />}
          </button>
          <button onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <span className="text-primary font-medium text-sm">{user?.fullName?.charAt(0) ?? 'U'}</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  )
}
