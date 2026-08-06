import { useMemo, useState, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { NavBar } from './components/NavBar'
import { HelpBot } from './components/HelpBot'
import { MiniBreak } from './components/MiniBreak'
import { OnlineUsersIndicator } from './components/OnlineUsersIndicator'
import { ActiveSessionBanner } from './components/ActiveSessionBanner'
import { useFocusStore } from './store/useFocusStore'
import { useFocusTracking } from './hooks/useFocusTracking'
import { useSessionTimer } from './hooks/useSessionTimer'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications'
import { getUserFromStorage } from './services/api'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Learn } from './pages/Learn'
import { Groups } from './pages/Groups'
import { Analytics } from './pages/Analytics'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Search } from './pages/Search'
import { Auth } from './pages/Auth'
import { DebugAuth } from './components/DebugAuth'

const PageWrapper = ({ children }) => <div className="app-shell min-h-screen">{children}</div>

function useActiveSession() {
  const sessions = useFocusStore((s) => s.sessions)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  return useMemo(() => sessions.find((s) => s.id === currentSessionId), [sessions, currentSessionId])
}

function App() {
  const location = useLocation()
  const { 
    endSession, 
    currentSessionId, 
    isAuthenticated, 
    user, 
    focusScore, 
    setAuthenticated,
    focusPreferences,
  } = useFocusStore()
  const [showBreak, setShowBreak] = useState(false)
  const activeSession = useActiveSession()

  // Initialize socket connection if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const userData = getUserFromStorage()
      if (userData) {
        // Initialize socket connection with user data
        setAuthenticated(true)
      }
    }
  }, [isAuthenticated, setAuthenticated])

  const studyTypes = ['pdf', 'youtube']
  const activeSessionContentType = String(activeSession?.contentType || '').toLowerCase()
  const isStudyContext = Boolean(currentSessionId && studyTypes.includes(activeSessionContentType))

  useFocusTracking(currentSessionId, {
    onThirdTabSwitch: () => setShowBreak(true),
    interventionEnabled: focusPreferences.tabSwitchInterventionEnabled,
    interventionStudyOnly: focusPreferences.tabSwitchInterventionStudyOnly,
    isStudyContext,
  })

  useRealtimeNotifications()

  useSessionTimer(currentSessionId, activeSession?.targetMinutes, () => {
    if (!currentSessionId) return
    endSession(currentSessionId, 'completed')
    toast.success('Target reached! Focus score updated.')
  })

  const hideNav = location.pathname === '/'

  return (
    <PageWrapper>
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/search" element={<Search />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <HelpBot />
      {!hideNav && <ActiveSessionBanner />}
      {!hideNav && <OnlineUsersIndicator />}
      {!hideNav && <DebugAuth />}
      <MiniBreak open={showBreak} onClose={() => setShowBreak(false)} />
      {hideNav ? null : (
        <footer className="mt-10 bg-transparent pb-10 text-center text-xs text-ink/60">
          FocusUp respects zero-state: nothing is prefilled. Add your own content to begin.
        </footer>
      )}
    </PageWrapper>
  )
}

export default App
