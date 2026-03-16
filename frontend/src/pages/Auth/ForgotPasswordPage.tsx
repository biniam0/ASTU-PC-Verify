import { Link } from 'react-router-dom'

export function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h1 className="text-center text-gray-800 font-semibold">Forgot Password</h1>
      <p className="mt-4 text-center text-sm text-gray-600">
        Password reset flow – to be connected to backend.
      </p>
      <Link
        to="/login"
        className="mt-6 text-sm text-blue-600 underline hover:text-blue-700"
      >
        Back to Sign in
      </Link>
    </div>
  )
}
