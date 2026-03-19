import type { SVGProps } from 'react'
import { useState, type FormEvent } from 'react'
import type { AuthResponse } from '@/services/authService'

function SvgPath(props: SVGProps<SVGPathElement>) {
  return <path {...props} />
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <SvgPath strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function getStoredUser(): AuthResponse['user'] | null {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function ProfilePage() {
  const user = getStoredUser()
  const [displayName, setDisplayName] = useState(user?.username ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      // TODO: PATCH /auth/profile or /users/me when backend is ready
      await new Promise((r) => setTimeout(r, 400))
      const updated = { ...user, username: displayName }
      localStorage.setItem('auth_user', JSON.stringify(updated))
      setMessage('Profile updated.')
    } catch {
      setMessage('Update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full max-w-md rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <PersonIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Profile</h2>
      </div>

      <div className="max-w-2xl space-y-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Account information</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">User ID</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user?.id ?? '–'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user?.role ?? '–'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Edit profile</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {message && (
              <div
                className={`rounded px-3 py-2 text-sm ${
                  message.startsWith('Profile') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}
            <div>
              <label htmlFor="displayName" className={labelClass}>
                Display name / Username
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                disabled={saving}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
