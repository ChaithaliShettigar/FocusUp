import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useFocusStore } from '../store/useFocusStore'
import { authAPI } from '../services/api'

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)
  const setAuthenticated = useFocusStore((s) => s.setAuthenticated)
  const setUser = useFocusStore((s) => s.setUser)
  const [verifying, setVerifying] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      if (!isAuthenticated) {
        setVerifying(false)
        return
      }

      try {
        const res = await authAPI.getCurrentUser()
        if (res.success && res.user) {
          setUser(res.user)
          setValid(true)
        } else {
          setAuthenticated(false)
          setValid(false)
        }
      } catch {
        setAuthenticated(false)
        setValid(false)
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    )
  }

  if (!isAuthenticated || !valid) {
    return <Navigate to="/auth" replace />
  }

  return children
}
