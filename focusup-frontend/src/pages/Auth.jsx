import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import { authAPI } from '../services/api'

export const Auth = () => {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', studentId: '', college: '', department: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const setUser = useFocusStore((s) => s.setUser)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const navigate = useNavigate()

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
        // Register mode
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

  return (
    <DoodleBackground>
      <div className="mx-auto max-w-3xl rounded-3xl bg-white/85 p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-ink">{mode === 'login' ? 'Login' : 'Register'}</h2>
            <p className="text-ink/70">
              {mode === 'login' 
                ? 'Sign in to your account' 
                : 'Create a new account to get started'}
            </p>
          </div>
          <div className="flex gap-2 rounded-full bg-clay/60 p-1">
            <button
              onClick={() => setMode('login')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-ink text-sand' : 'text-ink'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-ink text-sand' : 'text-ink'}`}
            >
              Register
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          {mode === 'register' && (
            <>
              <div className="md:col-span-2">
                <label className="text-sm text-ink/70">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-ink/70">Username * (3-20 characters)</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
                  placeholder="e.g., john_doe or johndoe23"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_\\-]+"
                  title="Only lowercase letters, numbers, underscores, and hyphens allowed"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-ink/70">Student ID (Optional)</label>
                <input
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
                  placeholder="e.g., STU123456"
                />
              </div>
            </>
          )}
          <div>
            <label className="text-sm text-ink/70">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-sm text-ink/70">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
            />
            {mode === 'register' && (
              <p className="mt-1 text-xs text-ink/50">
                Must be 8+ characters with uppercase, number, and special character
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-ink/70">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label className="text-sm text-ink/70">College (Optional)</label>
                <input
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-ink/70">Department (Optional)</label>
                <input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-3 py-2"
                />
              </div>
            </>
          )}
          <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-sand/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                {mode === 'login' ? 'Secure Login' : 'Create Account'}
              </p>
              <p className="text-xs text-ink/70">
                {mode === 'login' 
                  ? 'Your credentials are securely verified.' 
                  : 'Password must include uppercase, number, and special character.'}
              </p>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand shadow-soft disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </DoodleBackground>
  )
}
