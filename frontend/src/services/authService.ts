import { apiRequest } from './apiService'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token?: string
  user?: { id: string; username: string; role: string }
}

/** Call this from the login form when backend is ready. */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

/** Request password reset. Backend: POST /auth/forgot-password */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
