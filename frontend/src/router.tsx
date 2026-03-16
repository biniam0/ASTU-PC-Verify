import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/Auth/LoginPage'
import { HomePage } from '@/pages/Home'

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/forgot-password',
    element: <AuthLayout />,
    children: [{ index: true, element: <ForgotPasswordPage /> }],
  },
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
