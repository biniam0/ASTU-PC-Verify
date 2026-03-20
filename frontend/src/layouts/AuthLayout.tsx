import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-8 pb-12 px-4">
      <Outlet />
    </div>
  )
}
