import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useFocusStore } from '../store/useFocusStore'

export const useFocusTracking = (
  sessionId,
  {
    onThirdTabSwitch,
    interventionEnabled = true,
    interventionStudyOnly = true,
    isStudyContext = false,
  } = {}
) => {
  const logActivity = useFocusStore((s) => s.logActivity)
  const addTabSwitch = useFocusStore((s) => s.addTabSwitch)
  const interventionSwitchCountRef = useRef(0)
  const onThirdTabSwitchRef = useRef(onThirdTabSwitch)

  useEffect(() => {
    onThirdTabSwitchRef.current = onThirdTabSwitch
  }, [onThirdTabSwitch])

  useEffect(() => {
    if (!sessionId) return undefined

    let lastActive = Date.now()
    const idleThreshold = 15000 // 15s idle considered loss of focus

    const markActive = () => {
      lastActive = Date.now()
    }

    const tick = setInterval(() => {
      const now = Date.now()
      const delta = 1
      const idle = now - lastActive > idleThreshold
      logActivity(sessionId, { type: idle ? 'idle' : 'active', delta })
    }, 1000)

    const handleVisibility = () => {
      if (document.hidden) {
        addTabSwitch(sessionId)
        useFocusStore.getState().pushNotification('Tab switched — stay focused!', 'warning')

        const shouldIntervene =
          interventionEnabled && (!interventionStudyOnly || isStudyContext)

        if (!shouldIntervene) {
          toast.dismiss('tab-switch')
          return
        }

        interventionSwitchCountRef.current += 1

        if (interventionSwitchCountRef.current === 1 || interventionSwitchCountRef.current === 2) {
          toast(`FocusUp is waiting for you 📚 (${interventionSwitchCountRef.current}/3)`, { id: 'tab-switch' })
        } else if (interventionSwitchCountRef.current >= 3) {
          toast.dismiss('tab-switch')
          toast('Mini break time! A quick game is loading.', { icon: '🎮' })
          interventionSwitchCountRef.current = 0
          if (onThirdTabSwitchRef.current) onThirdTabSwitchRef.current()
        }
      } else {
        lastActive = Date.now()
      }
    }

    const events = ['scroll', 'mousemove', 'mousedown', 'touchstart', 'keydown', 'click']
    events.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(tick)
      events.forEach((evt) => window.removeEventListener(evt, markActive))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [
    sessionId,
    logActivity,
    addTabSwitch,
    interventionEnabled,
    interventionStudyOnly,
    isStudyContext,
  ])
}
