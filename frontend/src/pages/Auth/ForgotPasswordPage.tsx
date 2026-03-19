import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@/services/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setIsLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <img src="/logo.jpg" alt="ASTU" className="h-24 w-24 rounded-full object-contain" />
      <h1 className="mt-4 text-center text-gray-800">
        <span className="font-bold">ASTU</span>{' '}
        <span className="font-normal">PC MANAGEMENT</span>
      </h1>

      <div className="mt-8 w-full rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900">Forgot Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {success ? (
          <div className="mt-6 space-y-4">
            <div className="rounded bg-green-50 p-3 text-sm text-green-800">
              Check your email for a reset link. If you don’t see it, check your spam folder.
            </div>
            <Link
              to="/login"
              className="block w-full rounded bg-blue-600 py-2.5 text-center font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && (
              <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link
              to="/login"
              className="text-center text-sm text-blue-600 underline hover:text-blue-700"
            >
              Back to Sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
