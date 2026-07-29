import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { profileAPI, authAPI } from '../services/api'
import { FocusScoreBadge } from '../components/FocusScoreBadge'

export const Profile = () => {
  const user = useFocusStore((s) => s.user)
  const setUser = useFocusStore((s) => s.setUser)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [editingSection, setEditingSection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({ ...user })
  const navigate = useNavigate()

  useEffect(() => {
    setProfileData({ ...user })
  }, [user])

  const update = (key, value) => setProfileData({ ...profileData, [key]: value })

  const handleProfileSave = async () => {
    setLoading(true)
    try {
      const updates = {
        name: profileData.name,
        college: profileData.college,
        department: profileData.department,
        role: profileData.role,
        studentId: profileData.studentId,
      }
      
      const response = await profileAPI.updateProfile(updates)
      
      if (response.success) {
        setUser(response.user)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('All password fields are required.')
      return
    }
    
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match.')
      return
    }
    
    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const response = await profileAPI.updatePassword(
        passwordForm.current,
        passwordForm.new,
        passwordForm.confirm
      )
      
      if (response.success) {
        toast.success('Password changed successfully!')
        setPasswordForm({ current: '', new: '', confirm: '' })
        setEditingSection(null)
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublicFocus = async () => {
    setLoading(true)
    try {
      const response = await profileAPI.togglePublicFocus()
      
      if (response.success) {
        // Update local state with the new publicFocus value from response
        const newPublicFocus = response.publicFocus
        setUser({ ...user, publicFocus: newPublicFocus })
        toast.success(
          newPublicFocus 
            ? 'Focus stats are now public' 
            : 'Focus stats are now private'
        )
      }
    } catch (error) {
      console.error('Toggle public focus error:', error)
      toast.error(error.message || 'Failed to update privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:')
    
    if (!password) {
      toast.error('Password is required to delete account')
      return
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    
    if (!confirmDelete) return

    setLoading(true)
    try {
      const response = await authAPI.deleteAccount(password, true)
      
      if (response.success) {
        setUser({})
        setAuthenticated(false)
        toast.success('Account deleted successfully')
        navigate('/auth')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DoodleBackground>
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-4xl font-bold text-ink">Profile Settings</h2>
          <p className="mt-2 text-ink/70">Manage your personal information, security, and preferences.</p>
        </div>

        {/* Focus Score Badge */}
        <Section title="Your Focus Score" icon="🎯">
          <div className="flex flex-col items-center justify-center py-8">
            <FocusScoreBadge 
              score={user?.focusScore || 0} 
              size="large" 
              showLabel={true}
              showScore={true}
            />
            <p className="mt-6 text-center text-ink/70 text-sm max-w-md">
              {user?.focusScore >= 80 && "🚀 Outstanding! You're a focus master! Keep pushing your boundaries!"}
              {user?.focusScore >= 60 && user?.focusScore < 80 && "⭐ Great work! Your focus is impressive. Aim for the next level!"}
              {user?.focusScore >= 40 && user?.focusScore < 60 && "✨ Good progress! Keep building your focus habits for better results."}
              {user?.focusScore >= 20 && user?.focusScore < 40 && "🌙 You're on your way! Continue practicing to improve your focus."}
              {user?.focusScore < 20 && "🌱 Every journey starts somewhere! Begin your focus transformation today."}
            </p>
          </div>
        </Section>

        {/* Personal Information */}
        <Section title="Personal Information" icon="👤">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full Name" value={profileData.name} onChange={(e) => update('name', e.target.value)} />
            <FormField label="Email" value={user.email || 'not.set@focusup.com'} disabled placeholder="Email" />
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Role</label>
              <select
                value={profileData.role}
                onChange={(e) => update('role', e.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-ink focus:border-teal focus:outline-none"
              >
                <option value="student">🎓 Student</option>
                <option value="faculty">👨‍🏫 Faculty/Teacher</option>
              </select>
            </div>
            <FormField label="College/University" value={profileData.college} onChange={(e) => update('college', e.target.value)} />
            <FormField label="Department" value={profileData.department} onChange={(e) => update('department', e.target.value)} />
            <FormField label="Student ID" value={profileData.studentId || ''} onChange={(e) => update('studentId', e.target.value)} placeholder="e.g., STU123456" />
          </div>
          <div className="mt-4">
            <button
              onClick={handleProfileSave}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-teal to-teal-dark px-6 py-2.5 font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security & Password" icon="🔐">
          {editingSection === 'password' ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-ink focus:border-teal focus:outline-none"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-ink focus:border-teal focus:outline-none"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-ink focus:border-teal focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-teal-400 to-teal-600 px-6 py-2.5 font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null)
                    setPasswordForm({ current: '', new: '', confirm: '' })
                  }}
                  className="rounded-full border border-ink/20 px-6 py-2.5 font-semibold text-ink hover:bg-ink/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-sand/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">Password</p>
                  <p className="text-xs text-ink/70">Last changed: Never</p>
                </div>
                <button
                  onClick={() => setEditingSection('password')}
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-white transition-all"
                >
                  Change Password
                </button>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-sand/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">Two-Factor Authentication</p>
                  <p className="text-xs text-ink/70">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => toast.success('2FA setup coming soon!')}
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-white transition-all"
                >
                  Enable
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Privacy & Preferences */}
        <Section title="Privacy & Preferences" icon="⚙️">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-sand/50 px-4 py-3">
              <div>
                <p className="font-semibold text-ink">Focus Score Visibility</p>
                <p className="text-xs text-ink/70">Control whether others see your score on leaderboards</p>
              </div>
              <button
                onClick={handleTogglePublicFocus}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                  user.publicFocus ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white' : 'bg-white border border-ink/20 text-ink'
                }`}
              >
                {user.publicFocus ? '🌐 Public' : '🔒 Private'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-sand/50 px-4 py-3">
              <div>
                <p className="font-semibold text-ink">Email Notifications</p>
                <p className="text-xs text-ink/70">Receive study reminders and progress updates</p>
              </div>
              <button
                onClick={() => toast.success('Notification preferences updated!')}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-white transition-all"
              >
                ✓ Enabled
              </button>
            </div>


          </div>
        </Section>

        {/* Account Actions */}
        <Section title="Account Actions" icon="⚠️">
          <div className="space-y-3">
            <button
              onClick={() => toast.success('Active sessions will be logged out in 5 seconds')}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-all text-left"
            >
              🖥️ Logout from all devices
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="w-full rounded-2xl border border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-700 hover:bg-red-100 transition-all text-left disabled:opacity-50"
            >
              🗑️ Delete account permanently
            </button>
          </div>
        </Section>
      </div>
    </DoodleBackground>
  )
}

const Section = ({ title, icon, children }) => (
  <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
    <h3 className="mb-6 flex items-center gap-3 text-xl font-semibold text-ink">
      <span className="text-2xl">{icon}</span>
      {title}
    </h3>
    {children}
  </div>
)

const FormField = ({ label, value, onChange, disabled, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-ink mb-2">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-ink placeholder-ink/40 focus:border-teal focus:outline-none disabled:bg-ink/5 disabled:cursor-not-allowed"
    />
  </div>
)
