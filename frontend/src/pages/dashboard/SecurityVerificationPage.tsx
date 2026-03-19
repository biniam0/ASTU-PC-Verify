import type { SVGProps } from 'react'
import { useState, useEffect, type FormEvent } from 'react'
import {
  getVerificationStats,
  getVerificationLogs,
  verifyByStudentId,
} from '@/services/verificationService'
import type {
  VerificationLogEntry,
  VerificationResult,
  VerificationStats,
} from '@/types/verification'

const MOCK_STATS: VerificationStats = {
  totalScan: 100,
  verified: 67,
  alerts: 33,
}

const INSTRUCTIONS = [
  'Scan or manually enter the student ID',
  'Review the displayed laptop information',
  'Physically verify the laptop matches the registered details',
  'Check serial number and physical appearance',
  'Allow or deny exit based on verification results',
]

function SvgPath(props: SVGProps<SVGPathElement>) {
  return <path {...props} />
}

function ShieldLockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <SvgPath strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <SvgPath strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V6a3 3 0 013-3h3M21 9V6a3 3 0 00-3-3h-3M9 21H6a3 3 0 01-3-3v-3M15 21h3a3 3 0 003-3v-3" />
    </svg>
  )
}

export function SecurityVerificationPage() {
  const [stats, setStats] = useState<VerificationStats>(MOCK_STATS)
  const [logs, setLogs] = useState<VerificationLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
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

  async function handleScan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setScanError(null)
    setResult(null)
    if (!studentId.trim()) {
      setScanError('Enter a student ID.')
      return
    }
    setScanning(true)
    try {
      const data = await verifyByStudentId(studentId.trim())
      setResult(data)
    } catch (err) {
      setResult({
        success: false,
        studentId: studentId.trim(),
        message: err instanceof Error ? err.message : 'Verification failed. Student may not be registered or has no laptop.',
      })
    } finally {
      setScanning(false)
    }
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 bg-teal-500 px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldLockIcon className="h-6 w-6 shrink-0 text-white" />
          <h2 className="text-lg font-semibold text-white">Security Verification</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-900">{loading ? '–' : stats.totalScan}</p>
            <p className="text-sm text-gray-500">Total scan</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-green-600">{loading ? '–' : stats.verified}</p>
            <p className="text-sm text-gray-500">Verified</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-red-600">{loading ? '–' : stats.alerts}</p>
            <p className="text-sm text-gray-500">Alerts</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Scan Student ID</h3>
          <p className="mt-1 text-sm text-gray-600">
            Enter or scan the student ID to verify laptop ownership
          </p>
          <form onSubmit={handleScan} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="scan-student-id" className="mb-1 block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <input
                id="scan-student-id"
                type="text"
                placeholder="e.g. ASTU/2024/001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                aria-label="Student ID for verification"
                className="w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-900 placeholder-gray-500 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
                disabled={scanning}
              />
            </div>
            <button
              type="submit"
              disabled={scanning}
              className="rounded-full border border-gray-300 bg-gray-700 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {scanning ? 'Verifying…' : 'Verify'}
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500" aria-hidden>
              <ScanIcon className="h-5 w-5" />
            </span>
          </form>
          {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}
          {result && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                result.success ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-semibold">Verified — Student has registered laptop</p>
                  <dl className="grid gap-1 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-600">Student</dt><dd>{result.studentName ?? result.studentId}</dd></div>
                    {result.department && <div><dt className="text-gray-600">Department</dt><dd>{result.department}</dd></div>}
                    {result.laptop && (
                      <>
                        <div><dt className="text-gray-600">Laptop</dt><dd>{result.laptop.brandName} {result.laptop.model}</dd></div>
                        <div><dt className="text-gray-600">Serial</dt><dd>{result.laptop.serialNumber}</dd></div>
                      </>
                    )}
                  </dl>
                </div>
              ) : (
                <p className="font-semibold">Alert — {result.message ?? 'No registered laptop found for this student ID.'}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Verification Instructions:</h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-gray-700">
            {INSTRUCTIONS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
