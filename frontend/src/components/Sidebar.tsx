import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, History, User, LogOut, Zap,
  ChevronRight, Activity
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="w-64 h-screen bg-bg-surface border-r border-bg-border flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Resume Copilot
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Powered</p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-lg bg-emerald/5 border border-emerald/10 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-emerald" />
        <span className="text-xs text-emerald font-medium">AI Engine Online</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-title px-3 mt-2">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-neon-cyan' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-neon-cyan" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-bg-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-purple flex items-center justify-center text-xs font-bold text-bg-primary shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-danger hover:bg-danger/5 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
