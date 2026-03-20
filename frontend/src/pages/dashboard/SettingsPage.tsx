import type { SVGProps } from 'react'
import { useEffect, useState } from 'react'
import {
  addDepartment,
  addGate,
  deleteDepartment,
  deleteGate,
  getBackupConfig,
  getDepartments,
  getGates,
  triggerManualBackup,
  type Department,
  type GateConfig,
} from '@/services/settingsService'

function SvgPath(props: SVGProps<SVGPathElement>) {
  return <path {...props} />
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <SvgPath
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <SvgPath strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export function SettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [gates, setGates] = useState<GateConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptCode, setNewDeptCode] = useState('')
  const [savingDept, setSavingDept] = useState(false)

  const [newGateName, setNewGateName] = useState('')
  const [newGateLocation, setNewGateLocation] = useState('')
  const [newGateScannerType, setNewGateScannerType] = useState('barcode')
  const [newGateIp, setNewGateIp] = useState('')
  const [savingGate, setSavingGate] = useState(false)

  const [backupInfo, setBackupInfo] = useState<{
    lastRun?: string
    status?: string
  }>({})
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getDepartments(), getGates(), getBackupConfig()])
      .then(([deptData, gateData, backup]) => {
        if (cancelled) return
        setDepartments(deptData)
        setGates(gateData)
        setBackupInfo({
          lastRun: backup.lastBackup?.completed_at ?? backup.lastBackup?.triggered_at,
          status: backup.lastBackup?.status,
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load settings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAddDepartment() {
    setError(null)
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      setError('Department name and code are required.')
      return
    }
    setSavingDept(true)
    try {
      const dept = await addDepartment({ name: newDeptName.trim(), code: newDeptCode.trim() })
      setDepartments((prev) => [...prev, dept])
      setNewDeptName('')
      setNewDeptCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department')
    } finally {
      setSavingDept(false)
    }
  }

  async function handleDeleteDepartment(code: string) {
    if (!window.confirm(`Delete department ${code}?`)) return
    setError(null)
    try {
      await deleteDepartment(code)
      setDepartments((prev) => prev.filter((d) => d.code !== code))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department')
    }
  }

  async function handleAddGate() {
    setError(null)
    if (!newGateName.trim()) {
      setError('Gate name is required.')
      return
    }
    setSavingGate(true)
    try {
      const gate = await addGate({
        name: newGateName.trim(),
        location: newGateLocation.trim() || undefined,
        scannerType: newGateScannerType,
        ipAddress: newGateIp.trim() || undefined,
      })
      setGates((prev) => [...prev, gate])
      setNewGateName('')
      setNewGateLocation('')
      setNewGateScannerType('barcode')
      setNewGateIp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add gate')
    } finally {
      setSavingGate(false)
    }
  }

  async function handleDeleteGate(id: string) {
    if (!window.confirm('Delete this gate?')) return
    setError(null)
    try {
      await deleteGate(id)
      setGates((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gate')
    }
  }

  async function handleTriggerBackup() {
    setBackupMessage(null)
    setBackupError(null)
    setBackupLoading(true)
    try {
      const res = await triggerManualBackup()
      setBackupMessage(`Backup request queued (status: ${res.status}).`)
      const latest = await getBackupConfig()
      setBackupInfo({
        lastRun: latest.lastBackup?.completed_at ?? latest.lastBackup?.triggered_at,
        status: latest.lastBackup?.status,
      })
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Failed to trigger backup')
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <CogIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      <div className="max-w-2xl space-y-8">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Departments</h3>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-sm">
                {departments.length === 0 ? (
                  <li className="text-gray-500">No departments configured.</li>
                ) : (
                  departments.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-medium text-gray-900">{d.code}</span>{' '}
                        <span className="text-gray-700">— {d.name}</span>{' '}
                        {!d.is_active && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">inactive</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(d.code)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Department name (e.g. Software Engineering)"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. SE)"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:max-w-[8rem]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  disabled={savingDept}
                  className="inline-flex w-fit items-center rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {savingDept ? 'Adding…' : 'Add department'}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Gates</h3>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-sm">
                {gates.length === 0 ? (
                  <li className="text-gray-500">No gates configured.</li>
                ) : (
                  gates.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-medium text-gray-900">{g.name}</span>{' '}
                        {g.location && <span className="text-gray-700">— {g.location}</span>}{' '}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {g.scanner_type}
                        </span>{' '}
                        {g.ip_address && (
                          <span className="text-xs text-gray-500">({g.ip_address})</span>
                        )}
                        {!g.is_active && (
                          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">inactive</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGate(g.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Gate name (e.g. Main Gate)"
                    value={newGateName}
                    onChange={(e) => setNewGateName(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={newGateLocation}
                    onChange={(e) => setNewGateLocation(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={newGateScannerType}
                      onChange={(e) => setNewGateScannerType(e.target.value)}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:max-w-[10rem]"
                    >
                      <option value="barcode">Barcode</option>
                      <option value="qr">QR</option>
                      <option value="rfid">RFID</option>
                      <option value="manual">Manual</option>
                    </select>
                    <input
                      type="text"
                      placeholder="IP address (optional)"
                      value={newGateIp}
                      onChange={(e) => setNewGateIp(e.target.value)}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddGate}
                  disabled={savingGate}
                  className="inline-flex w-fit items-center rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {savingGate ? 'Adding…' : 'Add gate'}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Backups</h3>
          <p className="mt-1 text-sm text-gray-600">
            View backup status and trigger a manual backup request. Actual database backup execution is handled by server-side tooling.
          </p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Last backup</dt>
              <dd className="mt-0.5 text-gray-900">{backupInfo.lastRun ?? '–'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-0.5 text-gray-900">{backupInfo.status ?? '–'}</dd>
            </div>
          </dl>
          {backupMessage && (
            <div className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-800">{backupMessage}</div>
          )}
          {backupError && (
            <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{backupError}</div>
          )}
          <button
            type="button"
            onClick={handleTriggerBackup}
            disabled={backupLoading}
            className="mt-4 rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {backupLoading ? 'Requesting…' : 'Trigger manual backup'}
          </button>
        </section>
      </div>
    </div>
  )
}
