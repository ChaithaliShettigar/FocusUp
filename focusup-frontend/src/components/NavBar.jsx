import { useState } from 'react'
import GlobalSearchBar from './GlobalSearchBar'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFocusStore } from '../store/useFocusStore'
import { authAPI } from '../services/api'
import { Menu, X, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'

const links = [
  { to: '/dashboard', labelKey: 'dashboard' },
  { to: '/learn', labelKey: 'learn' },
  { to: '/groups', labelKey: 'groups' },
  { to: '/search', labelKey: 'search', label: '🔍 Search' },
  { to: '/analytics', labelKey: 'analytics' },
  { to: '/profile', labelKey: 'profile' },
  { to: '/settings', labelKey: 'settings' },
]

export const NavBar = () => {
  const { t } = useTranslation()
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const setUser = useFocusStore((s) => s.setUser)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setUser({})
      setAuthenticated(false)
      toast.success('Logged out successfully')
      navigate('/auth')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[rgba(247,242,233,0.9)] backdrop-blur-md border-b border-clay/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-ink">
          <span className="h-8 w-8 rounded-2xl bg-gradient-to-br from-accent to-leaf text-white grid place-items-center shadow-soft">F</span>
          <div>
            <div>FocusUp</div>
            <p className="text-xs text-ink/70">AI study partner</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 transition-all ${
                  isActive ? 'bg-ink text-sand shadow-soft' : 'text-ink/80 hover:bg-clay/70'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="rounded-full px-3 py-2 text-ink/80 hover:bg-clay/70 transition-all flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                `rounded-full px-3 py-2 transition-all ${
                  isActive ? 'bg-ink text-sand shadow-soft' : 'text-ink/80 hover:bg-clay/70'
                }`
              }
            >
              {t('login')}
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block w-56 mr-2">
            <GlobalSearchBar />
          </div>

          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden rounded-full border border-ink/10 bg-white/80 p-2 text-ink shadow-sm hover:shadow"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-clay/60 bg-[rgba(247,242,233,0.95)] backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <div className="grid gap-2">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-ink text-sand shadow-soft' : 'text-ink hover:bg-clay/70'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout()
                    setOpen(false)
                  }}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-clay/70 text-left flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-ink text-sand shadow-soft' : 'text-ink hover:bg-clay/70'
                    }`
                  }
                >
                  {t('login')}
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
