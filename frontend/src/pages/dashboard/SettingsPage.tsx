import type { SVGProps } from 'react'
import { useState } from 'react'

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
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // TODO: PATCH /settings when backend is ready
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <CogIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      <div className="max-w-2xl space-y-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Preferences</h3>
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">Email notifications</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
            </label>
            <p className="text-sm text-gray-500">
              Receive alerts and summary emails for verification and system updates.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Security</h3>
          <p className="mt-2 text-sm text-gray-600">
            Change password and security options. (To be connected to backend.)
          </p>
          <button
            type="button"
            disabled
            className="mt-4 rounded border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500"
          >
            Change password (coming soon)
          </button>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save settings
          </button>
          {saved && (
            <span className="text-sm font-medium text-green-600">Settings saved.</span>
          )}
        </div>
      </div>
    </div>
  )
}
