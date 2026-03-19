const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

function getErrorMessage(status: number): string {
  if (status === 404) return 'Not found. The API may not be running or the endpoint does not exist.'
  if (status >= 500) return 'Server error. Please try again later.'
  return `Request failed (${status}).`
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(getErrorMessage(res.status))
  const text = await res.text()
  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}
