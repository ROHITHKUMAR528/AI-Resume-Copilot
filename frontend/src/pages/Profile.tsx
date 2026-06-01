import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Edit3, Save, X, Shield, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      updateUser({ name: res.data.name })
      setEditing(false)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Update failed'),
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings</p>
      </div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 text-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan via-purple to-emerald mx-auto flex items-center justify-center text-3xl font-black text-bg-primary mb-4"
          style={{ boxShadow: '0 0 40px rgba(6,182,212,0.3)' }}
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h2 className="text-xl font-bold text-white">{user?.name}</h2>
        <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-xs text-emerald font-medium">Active Account</span>
        </div>
      </motion.div>

      {/* Settings card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-6"
      >
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-neon-cyan" />
          Account Information
        </h3>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Full Name
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field flex-1"
                autoFocus
              />
              <button
                onClick={() => updateMutation.mutate({ name })}
                disabled={!name || updateMutation.isPending}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditing(false); setName(user?.name || '') }} className="btn-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium flex-1">{user?.name}</span>
              <button onClick={() => setEditing(true)} className="btn-ghost text-xs">
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="cyber-divider" />

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-300">{user?.email}</span>
            <span className="badge-emerald ml-auto text-[10px]">Verified</span>
          </div>
        </div>

        <div className="cyber-divider" />

        {/* Member since */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Member Since
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-300">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })
                : '—'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Security card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mt-6 space-y-4"
      >
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-neon-cyan" />
          Security
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-slate-300 font-medium">JWT Authentication</p>
            <p className="text-xs text-slate-600 mt-0.5">Access token + refresh token</p>
          </div>
          <span className="badge-emerald text-[10px]">Active</span>
        </div>

        <div className="cyber-divider" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-danger hover:text-red-400 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of All Devices
        </button>
      </motion.div>
    </div>
  )
}
