import { useMemo, useState, useEffect, useCallback } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { NavBar } from './components/NavBar'
import { HelpBot } from './components/HelpBot'
import { MiniBreak } from './components/MiniBreak'

import { ActiveSessionBanner } from './components/ActiveSessionBanner'
import { TargetTimeModal } from './components/TargetTimeModal'
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
import { Notifications } from './pages/Notifications'
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
    updateSession,
    currentSessionId, 
    isAuthenticated, 
    user, 
    focusScore, 
    setAuthenticated,
    focusPreferences,
    updateFocusScoreRealtime,
  } = useFocusStore()
  const [showBreak, setShowBreak] = useState(false)
  const [showTargetReached, setShowTargetReached] = useState(false)
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

  const handleTargetReached = useCallback(() => {
    if (!currentSessionId) return
    setShowTargetReached(true)
    toast('Target time reached!', { icon: '⏰' })
  }, [currentSessionId])

  const handleContinueStudying = useCallback(() => {
    if (!currentSessionId) return
    // Clear the targetReached flag so the timer can fire again if needed
    updateSession(currentSessionId, { targetReached: false })
    setShowTargetReached(false)
    toast.success('Keep going! You\'re doing great.')
  }, [currentSessionId, updateSession])

  const handleEndSessionFromModal = useCallback(() => {
    if (!currentSessionId) return
    setShowTargetReached(false)
    endSession(currentSessionId, 'completed')
    updateFocusScoreRealtime()
    toast.success('Session completed! Focus score updated.')
  }, [currentSessionId, endSession, updateFocusScoreRealtime])

  useSessionTimer(currentSessionId, activeSession?.targetMinutes, handleTargetReached)

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
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <HelpBot />
      {!hideNav && <ActiveSessionBanner />}
      <MiniBreak open={showBreak} onClose={() => setShowBreak(false)} />

      <TargetTimeModal
        open={showTargetReached}
        elapsedSeconds={activeSession?.elapsedSeconds || 0}
        targetMinutes={activeSession?.targetMinutes || 25}
        onContinue={handleContinueStudying}
        onEndSession={handleEndSessionFromModal}
      />

    </PageWrapper>
  )
}

export default App
