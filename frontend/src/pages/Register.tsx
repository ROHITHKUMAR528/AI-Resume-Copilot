import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const registerMutation = useMutation({
    mutationFn: () => authAPI.register({ name, email, password }),
    onSuccess: (res) => {
      const { user, access_token, refresh_token } = res.data
      setAuth(user, access_token, refresh_token)
      toast.success(`Welcome to AI Resume Copilot, ${user.name}!`)
      navigate('/dashboard')
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || 'Registration failed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate()
  }

  const passwordChecks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ]

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(6,182,212,0.08), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 mb-4"
            style={{ boxShadow: '0 0 30px rgba(6,182,212,0.2)' }}
          >
            <Zap className="w-7 h-7 text-neon-cyan" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            AI Resume <span className="gradient-text-cyan">Copilot</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">Create your free account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1 text-[10px] ${ok ? 'text-emerald' : 'text-slate-600'}`}>
                      <CheckCircle className={`w-3 h-3 ${ok ? 'text-emerald' : 'text-slate-700'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              id="register-btn"
              disabled={registerMutation.isPending || !name || !email || !password}
              className="btn-primary w-full justify-center py-3"
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
              ) : (
                <>Create Account<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-cyan font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
