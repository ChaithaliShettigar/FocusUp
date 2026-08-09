import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useFocusStore } from '../store/useFocusStore'

export const NotificationBell = () => {
  const navigate = useNavigate()
  const notifications = useFocusStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative rounded-full p-2 bg-ink/10 hover:bg-ink/20 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-ink" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white min-w-[18px] h-[18px] px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
