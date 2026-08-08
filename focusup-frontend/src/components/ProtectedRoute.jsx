import { Navigate } from 'react-router-dom'
import { useFocusStore } from '../store/useFocusStore'

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}
