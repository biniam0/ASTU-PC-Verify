import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/Auth/LoginPage'
import { HomePage } from '@/pages/Home'
import { EditStudentPage } from '@/pages/dashboard/EditStudentPage'
import { ManageLaptopsPage } from '@/pages/dashboard/ManageLaptopsPage'
import { ManageStudentsPage } from '@/pages/dashboard/ManageStudentsPage'
import { RegisterLaptopPage } from '@/pages/dashboard/RegisterLaptopPage'
import { RegisterStudentPage } from '@/pages/dashboard/RegisterStudentPage'
import { VerificationPage } from '@/pages/dashboard/VerificationPage'

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
    element: <DashboardLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'register-student', element: <RegisterStudentPage /> },
      { path: 'register-laptop', element: <RegisterLaptopPage /> },
      { path: 'manage-students', element: <ManageStudentsPage /> },
      { path: 'students/:id/edit', element: <EditStudentPage /> },
      { path: 'manage-laptops', element: <ManageLaptopsPage /> },
      { path: 'verification', element: <VerificationPage /> },
    ],
  },
]
