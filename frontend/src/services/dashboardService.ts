import { apiRequest } from './apiService'
import type { DashboardData } from '@/types/dashboard'

/**
 * Fetch dashboard summary.
 * Backend: GET /api/dashboard/summary -> { summary: { totalStudents, totalLaptops, activeAlerts, ... } }
 * For now we map to the minimal DashboardData shape used on the home page.
 */
export async function getDashboard(): Promise<DashboardData | null> {
  const res = await apiRequest<{ summary?: any }>('/dashboard/summary')
  const summary = res?.summary
  if (!summary) return null

  return {
    stats: {
      totalStudents: Number(summary.totalStudents ?? 0),
      totalLaptops: Number(summary.totalLaptops ?? 0),
      pendingVerifications: Number(summary.activeAlerts ?? 0),
    },
    // Backend v1 does not expose "recent students" or "available laptops" lists,
    // so leave these empty and let the UI fall back to its mock data if desired.
    recentStudents: [],
    availableLaptops: [],
  }
}
