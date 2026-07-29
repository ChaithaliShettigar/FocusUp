import { useState } from 'react'
import { useFocusStore } from '../store/useFocusStore'
import { clearTokens } from '../services/api'
import { socketService } from '../services/socket'
import { toast } from 'react-hot-toast'

export const DebugAuth = () => {
  const [showDebug, setShowDebug] = useState(false)
  const setUser = useFocusStore((s) => s.setUser)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const user = useFocusStore((s) => s.user)
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)

  const getStorageInfo = () => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'), 
      user: localStorage.getItem('user'),
      storeUser: user,
      storeAuth: isAuthenticated
    }
  }

  const forceCompleteLogout = () => {
    try {
      // Clear all localStorage items related to auth
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // Reset store state
      setUser({
        name: '',
        email: '',
        college: '',
        department: '',
        role: 'student',
        publicFocus: false,
        studentId: '',
      })
      setAuthenticated(false)
      
      // Disconnect socket
      socketService.disconnect()
      
      toast.success('Completely logged out and cleared all data')
      
      // Force page refresh to ensure clean state
      window.location.reload()
    } catch (error) {
      console.error('Force logout error:', error)
      toast.error('Error during force logout')
    }
  }

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        title="Debug Authentication"
      >
        🔧 Debug Auth
      </button>
    )
  }

  const storageInfo = getStorageInfo()

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Authentication Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Access Token:</strong> {storageInfo.accessToken ? '✅ Present' : '❌ None'}
        </div>
        <div>
          <strong>Refresh Token:</strong> {storageInfo.refreshToken ? '✅ Present' : '❌ None'}
        </div>
        <div>
          <strong>Stored User:</strong> {storageInfo.user ? '✅ Present' : '❌ None'}
        </div>
        <div>
          <strong>Store Auth:</strong> {storageInfo.storeAuth ? '✅ True' : '❌ False'}
        </div>
        {storageInfo.user && (
          <div>
            <strong>User Email:</strong> {JSON.parse(storageInfo.user).email || 'N/A'}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => console.log('Storage Info:', storageInfo)}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
        >
          Log to Console
        </button>
        <button
          onClick={forceCompleteLogout}
          className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
        >
          Force Complete Logout
        </button>
      </div>
    </div>
  )
}