import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useFocusStore } from '../store/useFocusStore'

export const useRealtimeNotifications = () => {
  const { notifications } = useFocusStore()

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1]
      
      // Show toast notification
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