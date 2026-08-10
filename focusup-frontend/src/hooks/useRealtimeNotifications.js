import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useFocusStore } from '../store/useFocusStore'

export const useRealtimeNotifications = () => {
  const notifications = useFocusStore((s) => s.notifications)
  const prevCountRef = useRef(notifications.length)

  useEffect(() => {
    const prevCount = prevCountRef.current
    prevCountRef.current = notifications.length

    if (notifications.length > prevCount) {
      const latestNotification = notifications[notifications.length - 1]
      
      toast.success(latestNotification.message, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: 'white',
        },
        icon: '🔔',
      })
    }
  }, [notifications])
}

export default useRealtimeNotifications
