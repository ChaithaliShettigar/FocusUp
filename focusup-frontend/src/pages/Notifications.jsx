import { DoodleBackground } from '../components/DoodleBackground'
import { useFocusStore } from '../store/useFocusStore'
import { Link } from 'react-router-dom'
import {
  Bell, Clock, Users, BookOpen, Target, MessageSquare, AlertTriangle,
  Trash2, CheckCheck, ArrowLeft, BellOff
} from 'lucide-react'

const typeConfig = {
  deadline: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Deadline' },
  group: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Group' },
  material: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Material' },
  focus: { icon: Target, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Focus' },
  chat: { icon: MessageSquare, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200', label: 'Chat' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning' },
  info: { icon: Bell, color: 'text-ink/60', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Info' },
}

const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const Notifications = () => {
  const notifications = useFocusStore((s) => s.notifications)
  const markNotificationsRead = useFocusStore((s) => s.markNotificationsRead)
  const clearNotifications = useFocusStore((s) => s.clearNotifications)

  const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp)
  const unreadCount = sorted.filter((n) => !n.read).length

  // Group by date
  const groups = {}
  sorted.forEach((n) => {
    const date = new Date(n.timestamp).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(n)
  })

  return (
    <DoodleBackground>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-full hover:bg-clay/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-ink" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-ink">Notifications</h1>
              <p className="text-sm text-ink/50">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markNotificationsRead}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink/60 hover:bg-clay/50 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
                <button
                  onClick={clearNotifications}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Clear all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-clay/30 flex items-center justify-center mb-4">
              <BellOff className="w-10 h-10 text-ink/20" />
            </div>
            <h3 className="text-lg font-bold text-ink/40 mb-1">No notifications</h3>
            <p className="text-sm text-ink/30 max-w-xs">
              You'll see notifications here for deadlines, group messages, focus sessions, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-xs font-bold text-ink/40 uppercase tracking-wider mb-3 px-1">{date}</h3>
                <div className="space-y-2">
                  {items.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.info
                    const Icon = cfg.icon
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                          !n.read
                            ? `${cfg.bg} ${cfg.border} shadow-sm`
                            : 'bg-white/80 border-ink/10 hover:shadow-sm'
                        }`}
                      >
                        <div className={`shrink-0 p-2.5 rounded-xl ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${!n.read ? 'font-medium text-ink' : 'text-ink/70'}`}>
                            {n.message}
                          </p>
                          <p className="text-[11px] text-ink/40 mt-1.5 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(n.timestamp)}
                            </span>
                            <span>{formatTime(n.timestamp)}</span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoodleBackground>
  )
}
