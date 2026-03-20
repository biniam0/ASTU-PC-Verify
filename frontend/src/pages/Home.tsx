import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '@/services/dashboardService'
import type { DashboardData } from '@/types/dashboard'

const MOCK_DASHBOARD: DashboardData = {
  stats: {
    totalStudents: 120,
    totalLaptops: 85,
    pendingVerifications: 5,
  },
  recentStudents: [
    { id: '1', fullName: 'Abebe Kebede', department: 'CSE' },
    { id: '2', fullName: 'Tariku Alemu', department: 'ECE' },
    { id: '3', fullName: 'Sara Mohammed', department: 'ME' },
    { id: '4', fullName: 'Lemma Desta', department: 'CEE' },
  ],
  availableLaptops: [
    { id: '1', brandName: 'Dell', model: 'i5', laptopId: 'LPT/001' },
    { id: '2', brandName: 'HP', model: 'i7', laptopId: 'LPT/003' },
    { id: '3', brandName: 'Lenovo', model: 'Ryzen 5', laptopId: 'LPT/004' },
  ],
}

function PersonNodesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

export function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getDashboard()
      .then((res) => {
        if (!cancelled && res) setData(res)
      })
      .catch(() => {
        if (!cancelled) setData(MOCK_DASHBOARD)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats ?? MOCK_DASHBOARD.stats
  const recentStudents = data?.recentStudents ?? MOCK_DASHBOARD.recentStudents
  const availableLaptops = data?.availableLaptops ?? MOCK_DASHBOARD.availableLaptops

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Welcome to ASTU PC Management
        </h1>
        <p className="mt-2 text-gray-600">
          Use the sidebar to register students and laptops, manage records, or run verification.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-lg bg-[#5da9dd] p-5 text-white shadow-sm">
          <PersonNodesIcon className="h-12 w-12 shrink-0 opacity-90" />
          <div>
            <p className="text-2xl font-bold">{loading ? '–' : stats.totalStudents}</p>
            <p className="text-sm font-medium opacity-90">Total students</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-[#88d8c0] p-5 text-white shadow-sm">
          <LaptopIcon className="h-12 w-12 shrink-0 opacity-90" />
          <div>
            <p className="text-2xl font-bold">{loading ? '–' : stats.totalLaptops}</p>
            <p className="text-sm font-medium opacity-90">Total laptops</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-[#f38d64] p-5 text-white shadow-sm">
          <ShieldCheckIcon className="h-12 w-12 shrink-0 opacity-90" />
          <div>
            <p className="text-2xl font-bold">{loading ? '–' : stats.pendingVerifications}</p>
            <p className="text-sm font-medium opacity-90">Pending verifications</p>
          </div>
        </div>
      </div>

      {/* Two-column lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recently Registered Students */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recently Registered Students</h3>
            <Link
              to="/manage-students"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {recentStudents.length === 0 ? (
              <li className="py-3 text-sm text-gray-500">No recent students</li>
            ) : (
              recentStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <span className="text-gray-900">{s.fullName}</span>
                  <span className="text-sm text-gray-500">{s.department}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Available Laptops */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Available Laptops</h3>
            <Link
              to="/manage-laptops"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {availableLaptops.length === 0 ? (
              <li className="py-3 text-sm text-gray-500">No available laptops</li>
            ) : (
              availableLaptops.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3">
                  <span className="text-gray-900">
                    {l.brandName} {l.model}
                  </span>
                  <span className="text-sm text-gray-500">{l.laptopId}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
