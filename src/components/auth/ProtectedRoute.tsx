'use client'

// DOGFOODING MODE: Authentication disabled
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Dogfooding mode - no authentication required
  return <>{children}</>
}