import { useEffect, useRef } from 'react'
import { useFocusStore } from '../store/useFocusStore'

export const useSessionTimer = (sessionId, targetMinutes, onTargetReached) => {
  const hasReachedTarget = useRef(false)

  useEffect(() => {
    if (!sessionId || !targetMinutes) return undefined

    // Reset flag when session changes
    hasReachedTarget.current = false

    const tick = setInterval(() => {
      const current = useFocusStore.getState().sessions.find((s) => s.id === sessionId)
      if (!current) return

      if (current.elapsedSeconds >= targetMinutes * 60 && !hasReachedTarget.current) {
        hasReachedTarget.current = true
        // Set targetReached flag on session
        useFocusStore.getState().updateSession(sessionId, { targetReached: true })
        if (onTargetReached) {
          onTargetReached()
        }
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [sessionId, targetMinutes, onTargetReached])
}
