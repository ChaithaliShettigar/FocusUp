import { useFocusStore } from '../store/useFocusStore'
import { Wifi, Users } from 'lucide-react'

export const OnlineUsersIndicator = () => {
  const { onlineUsers } = useFocusStore()

  if (onlineUsers.length === 0) {
    return null
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-3 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <Users className="w-4 h-4 text-green-500" />
          <span className="font-medium text-green-700 text-sm">
            {onlineUsers.length} User{onlineUsers.length === 1 ? '' : 's'} Online
          </span>
        </div>
        
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {onlineUsers.slice(0, 5).map((user) => (
            <div key={user.userId} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">{user.username}</span>
              </div>
              <span className="text-teal-600 font-bold">{user.focusScore}</span>
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="text-xs text-gray-500 text-center pt-1 border-t">
              +{onlineUsers.length - 5} more online
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnlineUsersIndicator