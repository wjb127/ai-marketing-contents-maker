'use client'

// DOGFOODING MODE: Simplified AuthProvider that just renders children
// The actual auth is handled by the useAuth hook

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // DOGFOODING MODE: Just return children without any auth context
  return <>{children}</>
}