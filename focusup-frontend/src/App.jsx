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
import { ProtectedRoute } from './components/ProtectedRoute'

const PageWrapper = ({ children }) => <div className="app-shell min-h-screen flex flex-col">{children}</div>

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
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <HelpBot />
      {!hideNav && <ActiveSessionBanner />}
      {!hideNav && <OnlineUsersIndicator />}

      <MiniBreak open={showBreak} onClose={() => setShowBreak(false)} />

    </PageWrapper>
  )
}

export default App
