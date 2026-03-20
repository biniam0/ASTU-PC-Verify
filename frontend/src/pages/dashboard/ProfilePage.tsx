import type { SVGProps } from 'react'
import { useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '@/services/authService'
import { changePassword, fetchProfile, updateOwnProfile } from '@/services/authService'

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

export function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
  })
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    fetchProfile()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setProfileForm({
          fullName: u.fullName ?? '',
          username: u.username,
          email: u.email,
        })
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load profile')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setProfileMessage(null)
    setProfileError(null)

    const { fullName, username, email } = profileForm
    if (!username.trim() || !email.trim()) {
      setProfileError('Username and email are required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileError('Enter a valid email address.')
      return
    }

    // Only admins are allowed to update profile via /users/:id in current backend
    if (user.role !== 'admin') {
      setProfileError('Profile editing is only available for admin users in the current version.')
      return
    }

    setProfileSaving(true)
    try {
      const updated = await updateOwnProfile(user.id, {
        fullName: fullName.trim() || undefined,
        username: username.trim(),
        email: email.trim(),
      })
      setUser(updated)
      setProfileForm({
        fullName: updated.fullName ?? '',
        username: updated.username,
        email: updated.email,
      })
      setProfileMessage('Profile updated successfully.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Update failed. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  function handleProfileCancel() {
    if (!user) return
    setProfileForm({
      fullName: user.fullName ?? '',
      username: user.username,
      email: user.email,
    })
    setProfileMessage(null)
    setProfileError(null)
  }

  function getPasswordStrengthLabel(pw: string): { label: string; className: string } {
    if (!pw) return { label: 'None', className: 'text-gray-500' }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[@$!%*?&]/.test(pw)) score++
    if (score >= 4) return { label: 'Strong', className: 'text-green-600' }
    if (score >= 3) return { label: 'Medium', className: 'text-yellow-600' }
    return { label: 'Weak', className: 'text-red-600' }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    setPasswordSaving(true)
    try {
      const res = await changePassword({ currentPassword, newPassword })
      setPasswordMessage(res.message || 'Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  function handlePasswordCancel() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage(null)
    setPasswordError(null)
  }

  const inputClass =
    'w-full max-w-md rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading profile…</div>
  }

  if (loadError || !user) {
    return (
      <div>
        <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
          <PersonIcon className="h-6 w-6 shrink-0 text-white" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError ?? 'Failed to load profile.'}
        </div>
      </div>
    )
  }

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
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user.fullName ?? '–'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Username</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user.username}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user.email}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Edit profile</h3>
          <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
            {profileMessage && (
              <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {profileError}
              </div>
            )}
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                className={inputClass}
                disabled={profileSaving || user.role !== 'admin'}
              />
            </div>
            <div>
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                className={inputClass}
                disabled={profileSaving || user.role !== 'admin'}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                disabled={profileSaving || user.role !== 'admin'}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={profileSaving || user.role !== 'admin'}
                className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {profileSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={handleProfileCancel}
                disabled={profileSaving}
                className="rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-blue-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
            {user.role !== 'admin' && (
              <p className="text-xs text-gray-500">
                Profile fields are read-only for security users. Contact an administrator to update your account details.
              </p>
            )}
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Change password</h3>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            {passwordMessage && (
              <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{passwordMessage}</div>
            )}
            {passwordError && (
              <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>
            )}
            <div>
              <label htmlFor="currentPassword" className={labelClass}>
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                disabled={passwordSaving}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className={labelClass}>
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                disabled={passwordSaving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </p>
              <p className={`mt-1 text-xs font-medium ${getPasswordStrengthLabel(newPassword).className}`}>
                Strength: {getPasswordStrengthLabel(newPassword).label}
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                disabled={passwordSaving}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Save new password'}
              </button>
              <button
                type="button"
                onClick={handlePasswordCancel}
                disabled={passwordSaving}
                className="rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-blue-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
