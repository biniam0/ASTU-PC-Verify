import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/register-student', label: 'Register student', icon: PersonIcon },
  { to: '/register-laptop', label: 'Register Laptop', icon: LaptopIcon },
  { to: '/manage-students', label: 'Manage Students', icon: PeopleIcon },
  { to: '/manage-laptops', label: 'Manage laptops', icon: MonitorIcon },
  { to: '/verification', label: 'Verification', icon: ShieldCheckIcon },
] as const

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function MonitorIcon({ className }: { className?: string }) {
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

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Toggle sidebar"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/logo.svg" alt="ASTU" className="h-10 w-10 shrink-0 rounded-full object-contain" />
        <div className="flex-1" />
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100"
          aria-label="User menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* Turquoise content bar + layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`shrink-0 border-r border-gray-200 bg-white transition-[width] duration-200 ${
            sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
          }`}
        >
          <nav className="flex flex-col py-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-gray-800 transition-colors hover:bg-gray-50 ${
                    isActive ? 'border-l-4 border-teal-500 bg-teal-50/50 font-medium text-teal-800' : 'border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          <div className="h-1.5 shrink-0 bg-teal-500" role="presentation" />
          <main className="flex-1 bg-white p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-gray-200 bg-white py-3 text-center text-sm text-gray-500">
        Copyright © 2021 Winner Systems. All rights reserved.
      </footer>
    </div>
  )
}
