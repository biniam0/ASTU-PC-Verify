import { apiRequest } from './apiService'
import type { DashboardData } from '@/types/dashboard'

/** Fetch dashboard data (stats + recent students + available laptops). Backend: GET /dashboard */
export async function getDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/dashboard')
}
