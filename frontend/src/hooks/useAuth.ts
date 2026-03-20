import type { AuthUser } from '@/services/authService'
import { clearStoredAuth } from '@/services/authService'

// Lightweight auth helper reading from localStorage.
// This keeps UI wiring simple for the MVP and works with the
// token persisted by authService.login / fetchProfile.
export function useAuth() {
  if (typeof window === 'undefined') {
    return { user: null as AuthUser | null, isAuthenticated: false, logout: () => {} }
  }

  let user: AuthUser | null = null
  try {
    const raw = window.localStorage.getItem('authUser')
    user = raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    user = null
  }

  const logout = () => {
    clearStoredAuth()
    window.location.href = '/login'
  }

  return { user, isAuthenticated: !!user, logout }
}
