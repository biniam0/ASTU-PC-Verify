import type { RouteObject } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { HomePage } from '@/pages/Home'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // Add more routes here, e.g.:
      // { path: 'dashboard', element: <DashboardPage /> },
    ],
  },
]
