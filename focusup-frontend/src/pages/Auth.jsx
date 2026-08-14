import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import { authAPI } from '../services/api'
import { Focus, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

const randomName = () => `field_${Math.random().toString(36).slice(2, 8)}`

export const Auth = () => {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', studentId: '', college: '', department: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const setUser = useFocusStore((s) => s.setUser)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Email and password are required.')
      return
    }
    
    if (mode === 'register' && !form.name.trim()) {
      toast.error('Please add your name to register.')
      return
    }

    if (mode === 'register' && !form.username.trim()) {
      toast.error('Username is required.')
      return
    }

    setLoading(true)
    
    try {
      if (mode === 'login') {
        const response = await authAPI.login(form.email, form.password)
        
        if (response.success) {
          setUser(response.user)
          setAuthenticated(true)
          toast.success('Logged in successfully!')
          navigate('/dashboard')
        }
      } else {
        const userData = {
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          studentId: form.studentId || undefined,
          college: form.college || undefined,
          department: form.department || undefined,
          role: form.role,
        }
        
        const response = await authAPI.register(userData)
        
        if (response.success) {
          setUser(response.user)
          setAuthenticated(true)
          toast.success('Registration successful! Welcome to FocusUp!')
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/10 transition-all"

  // Random field names to prevent browser autofill
  const emailFieldName = useState(randomName)[0]
  const passwordFieldName = useState(randomName)[0]

  return (
    <DoodleBackground>
      <div className="flex items-start justify-center pt-4 pb-12">
        <div className="w-full max-w-xl">
          {/* Brand header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-leaf shadow-lg mb-4">
              <Focus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              {mode === 'login'
                ? 'Sign in to continue your learning journey'
                : 'Start your focused learning journey today'}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white border border-ink/8 shadow-xl shadow-ink/8 p-8">
            {/* Mode toggle */}
            <div className="flex gap-1 rounded-xl bg-clay/50 p-1 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-ink text-sand shadow-md' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === 'register' ? 'bg-ink text-sand shadow-md' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4" autoComplete="off">
              {/* Register: Name */}
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-ink/60 mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={`${inputClass} pl-9`}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Register: Username + Student ID */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink/60 mb-1 block">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                      className={inputClass}
                      placeholder="johndoe"
                      minLength={3}
                      maxLength={20}
                      pattern="[a-z0-9_\\-]+"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink/60 mb-1 block">Student ID</label>
                    <input
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className={inputClass}
                      placeholder="STU123456"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-ink/60 mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                  <input
                    type="email"
                    name={emailFieldName}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`${inputClass} pl-9`}
                    placeholder="you@example.com"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-ink/60 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                  <input
                    type="password"
                    name={passwordFieldName}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`${inputClass} pl-9`}
                    placeholder={mode === 'register' ? '8+ chars, uppercase, number, symbol' : 'Enter your password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Register: College + Department + Role */}
              {mode === 'register' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink/60 mb-1 block">College</label>
                    <input
                      value={form.college}
                      onChange={(e) => setForm({ ...form, college: e.target.value })}
                      className={inputClass}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink/60 mb-1 block">Dept</label>
                    <input
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className={inputClass}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink/60 mb-1 block">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={inputClass}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 rounded-xl bg-gradient-to-r from-ink to-ink/85 py-3 text-sm font-semibold text-white shadow-lg shadow-ink/15 transition-all hover:shadow-xl hover:from-teal hover:to-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-5 text-center text-xs text-ink/45">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="font-semibold text-teal hover:text-teal/80 transition-colors">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="font-semibold text-teal hover:text-teal/80 transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </DoodleBackground>
  )
}
