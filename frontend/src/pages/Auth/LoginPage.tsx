import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      {/* Logo – circular clip to remove white corners */}
      <div className="h-28 w-28 overflow-hidden rounded-full bg-transparent">
        <img
          src="/logo.jpg"
          alt="ASTU"
          className="h-full w-full object-contain"
        />
      </div>
      {/* System title */}
      <h1 className="mt-4 text-center text-gray-800">
        <span className="font-bold">ASTU</span>{" "}
        <span className="font-normal">PC MANAGEMENT</span>
      </h1>

      {/* Login card */}
      <div className="mt-8 w-full rounded-lg bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoComplete="email"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoComplete="current-password"
            disabled={isLoading}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="text-sm">Signing in…</span>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <span>Sign in</span>
                </>
              )}
            </button>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 underline hover:text-blue-700"
            >
              Forgot Password ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
