import { useState, useEffect } from 'react'
import { getVerificationStats, getVerificationLogs } from '@/services/verificationService'
import type { VerificationLogEntry, VerificationStats } from '@/types/verification'

const MOCK_STATS: VerificationStats = {
  totalScan: 100,
  verified: 67,
  alerts: 33,
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

export function VerificationPage() {
  const [stats, setStats] = useState<VerificationStats>(MOCK_STATS)
  const [logs, setLogs] = useState<VerificationLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getVerificationStats(), getVerificationLogs()])
      .then(([statsData, logsData]) => {
        if (!cancelled) {
          setStats(statsData ?? MOCK_STATS)
          setLogs(Array.isArray(logsData) ? logsData : [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(MOCK_STATS)
          setLogs([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      {/* Teal title bar */}
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <ShieldCheckIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Verification</h2>
      </div>

      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{loading ? '–' : stats.totalScan}</p>
            <p className="mt-1 text-sm text-gray-500">Total scan</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{loading ? '–' : stats.verified}</p>
            <p className="mt-1 text-sm text-gray-500">Verified</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <p className="text-2xl font-bold text-red-600">{loading ? '–' : stats.alerts}</p>
            <p className="mt-1 text-sm text-gray-500">Alerts</p>
          </div>
        </div>

        {error && (
          <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Verification logs / data panel */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
            Verification log
          </h3>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No verification records yet. Scan results will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                      Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                      Student ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                      Result
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {entry.studentId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            entry.result === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.result === 'verified' ? 'Verified' : 'Alert'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.message || entry.studentName || '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
