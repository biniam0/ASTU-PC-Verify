import type { RouteObject } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ForgotPasswordPage } from "@/pages/Auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/Auth/LoginPage";
import { HomePage } from "@/pages/Home";
import { EditLaptopPage } from "@/pages/dashboard/EditLaptopPage";
import { LaptopDetailPage } from "@/pages/dashboard/LaptopDetailPage";
import { EditStudentPage } from "@/pages/dashboard/EditStudentPage";
import { ManageLaptopsPage } from "@/pages/dashboard/ManageLaptopsPage";
import { ManageUsersPage } from "@/pages/dashboard/ManageUsersPage";
import { ManageStudentsPage } from "@/pages/dashboard/ManageStudentsPage";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { RegisterLaptopPage } from "@/pages/dashboard/RegisterLaptopPage";
import { RegisterStudentPage } from "@/pages/dashboard/RegisterStudentPage";
import { SecurityVerificationPage } from "@/pages/dashboard/SecurityVerificationPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { AlertsPage } from "@/pages/dashboard/AlertsPage";

export const routes: RouteObject[] = [
  {
    path: "/login",
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: "/forgot-password",
    element: <AuthLayout />,
    children: [{ index: true, element: <ForgotPasswordPage /> }],
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "register-student", element: <RegisterStudentPage /> },
      { path: "register-laptop", element: <RegisterLaptopPage /> },
      { path: "manage-students", element: <ManageStudentsPage /> },
      { path: "manage-users", element: <ManageUsersPage /> },
      { path: "students/:id/edit", element: <EditStudentPage /> },
      { path: "manage-laptops", element: <ManageLaptopsPage /> },
      { path: "laptops/:id", element: <LaptopDetailPage /> },
      { path: "laptops/:id/edit", element: <EditLaptopPage /> },
      { path: "security-verification", element: <SecurityVerificationPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
];
