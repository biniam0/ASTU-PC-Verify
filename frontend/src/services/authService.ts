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
