import { useEffect } from 'react'
import { useFocusStore } from '../store/useFocusStore'

export const useSessionTimer = (sessionId, targetMinutes, onComplete) => {
  useEffect(() => {
    if (!sessionId || !targetMinutes) return undefined
    const tick = setInterval(() => {
      const current = useFocusStore.getState().sessions.find((s) => s.id === sessionId)
      if (!current) return
      if (current.elapsedSeconds >= targetMinutes * 60) {
        clearInterval(tick)
        if (onComplete) {
          onComplete()
          // Trigger real-time focus score update when session completes
          const { updateFocusScoreRealtime } = useFocusStore.getState()
          updateFocusScoreRealtime()
        }
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [sessionId, targetMinutes, onComplete])
}
