import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusStore } from '../store/useFocusStore'
import { Play, X } from 'lucide-react'

export const ActiveSessionBanner = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeContentId = useFocusStore((s) => s.activeContentId)
  const contents = useFocusStore((s) => s.contents)
  const endSession = useFocusStore((s) => s.endSession)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const sessions = useFocusStore((s) => s.sessions)
  
  const [dismissed, setDismissed] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const activeContent = contents.find(c => c.id === activeContentId)
  const activeSession = sessions.find(s => s.id === currentSessionId)
  const isOnLearnPage = location.pathname === '/learn'
  
  useEffect(() => {
    if (!activeContentId) return
    
    const savedSession = localStorage.getItem('activeSession')
    if (savedSession) {
      try {
        const { startedAt } = JSON.parse(savedSession)
        const updateTimer = () => {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000)
          setElapsedTime(elapsed)
        }
        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
      } catch {}
    }
  }, [activeContentId])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const targetMinutes = activeSession?.targetMinutes || 25
  const remaining = Math.max(0, targetMinutes * 60 - elapsedTime)

  const handleContinue = () => {
    navigate('/learn')
    setDismissed(false)
  }

  const handleEndSession = () => {
    if (currentSessionId) {
      endSession(currentSessionId, 'completed')
    }
    setDismissed(true)
  }

  if (!activeContentId || !activeContent || isOnLearnPage || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 z-50"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ink to-ink/90 px-4 py-3 text-sand shadow-xl border border-ink/20">
          <div className="relative">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent"></span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-sand/70">Active Session</span>
            <span className="text-sm font-semibold truncate max-w-[150px]">
              {activeContent.title}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-lg font-mono font-bold text-accent">
              {formatTime(remaining)}
            </span>
            <span className="text-[10px] text-sand/60">remaining</span>
          </div>
          
          <button
            onClick={handleContinue}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-ink hover:bg-accent/90 transition-colors"
          >
            <Play className="w-3 h-3" />
            Continue
          </button>
          
          <button
            onClick={handleEndSession}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
            title="End Session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
