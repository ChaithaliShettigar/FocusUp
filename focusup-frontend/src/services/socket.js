import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
  }

  connect(userData) {
    if (this.socket && this.isConnected) {
      return this.socket
    }

    // Clean up any stale socket before creating a new one
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    const socketBase = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5010')

    this.socket = io(socketBase, {
      withCredentials: true,
      autoConnect: true,
    })

    // Store userData for reconnection
    this._userData = userData

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server')
      this.isConnected = true
      
      // Authenticate user on every connect (including reconnection)
      if (this._userData) {
        this.socket.emit('authenticate', this._userData)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      this.isConnected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this._userData = null
      this.listeners.clear()
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
      // Store callback for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set())
      }
      this.listeners.get(event).add(callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
      // Remove from stored callbacks
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback)
      }
    }
  }

  // Group-specific methods
  joinGroup(groupId) {
    this.emit('joinGroup', groupId)
  }

  leaveGroup(groupId) {
    this.emit('leaveGroup', groupId)
  }

  updateGroup(groupData) {
    this.emit('groupUpdate', groupData)
  }

  sendGroupMessage(messageData) {
    this.emit('sendGroupMessage', messageData)
  }

  updateFocusScore(userData) {
    this.emit('focusScoreUpdate', userData)
  }

  // Event listeners for real-time updates
  onGroupCreated(callback) {
    this.on('groupCreated', callback)
  }

  onMemberJoinedGroup(callback) {
    this.on('memberJoinedGroup', callback)
  }

  onMemberLeftGroup(callback) {
    this.on('memberLeftGroup', callback)
  }

  onGroupUpdated(callback) {
    this.on('groupUpdated', callback)
  }

  onGroupMessageReceived(callback) {
    this.on('groupMessageReceived', callback)
  }

  onUserOnline(callback) {
    this.on('userOnline', callback)
  }

  onUserOffline(callback) {
    this.on('userOffline', callback)
  }

  onUserFocusScoreUpdated(callback) {
    this.on('userFocusScoreUpdated', callback)
  }

  onUserJoinedGroup(callback) {
    this.on('userJoinedGroup', callback)
  }

  onUserLeftGroup(callback) {
    this.on('userLeftGroup', callback)
  }

  // Deadline events
  onDeadlineCreated(callback) {
    this.on('deadlineCreated', callback)
  }

  onDeadlineUpdated(callback) {
    this.on('deadlineUpdated', callback)
  }

  onDeadlineDeleted(callback) {
    this.on('deadlineDeleted', callback)
  }

  onDeadlineCompleted(callback) {
    this.on('deadlineCompleted', callback)
  }

  onDeadlineReminder(callback) {
    this.on('deadlineReminder', callback)
  }

  // Cleanup method
  removeAllListeners(event) {
    if (this.socket && this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      callbacks.forEach(callback => {
        this.socket.off(event, callback)
      })
      this.listeners.delete(event)
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService()

export default socketService