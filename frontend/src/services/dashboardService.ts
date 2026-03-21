import { apiRequest } from "./apiService";
import type {
  AlertSummaryStats,
  DashboardActivityItem,
  DashboardData,
} from "@/types/dashboard";

/**
 * Fetch dashboard data for the home screen using live backend endpoints.
 *
 * Backend:
 * - GET /api/dashboard/summary -> { summary: { ... } }
 * - GET /api/dashboard/alerts  -> { stats: { ... } }
 * - GET /api/dashboard/activity/recent -> { activity: [...] }
 */
export async function getDashboard(): Promise<DashboardData | null> {
  const [summaryRes, alertsRes, activityRes] = await Promise.all([
    apiRequest<{ summary?: any }>("/dashboard/summary"),
    apiRequest<{ stats?: any }>("/dashboard/alerts"),
    apiRequest<{ activity?: any[] }>("/dashboard/activity/recent"),
  ]);

  const summary = summaryRes?.summary;
  if (!summary) return null;

  const alertsStats = alertsRes?.stats;
  const alertsSummary: AlertSummaryStats | undefined = alertsStats
    ? {
        totalAlerts: Number(alertsStats.totalAlerts ?? 0),
        activeAlerts: Number(alertsStats.activeAlerts ?? 0),
        resolvedAlerts: Number(alertsStats.resolvedAlerts ?? 0),
        falseAlarms: Number(alertsStats.falseAlarms ?? 0),
      }
    : undefined;

  const recentActivity: DashboardActivityItem[] | undefined = Array.isArray(
    activityRes?.activity,
  )
    ? activityRes!.activity.map((row) => ({
        id: String(row.id),
        kind: row.kind === "alert" ? "alert" : "scan",
        studentIdentifier: row.scanned_student_id ?? undefined,
        status: row.status ?? undefined,
        type: row.type ?? undefined,
        severity: row.severity ?? undefined,
        gateLocation: row.gate_location ?? undefined,
        createdAt: row.created_at,
      }))
    : undefined;

  return {
    stats: {
      totalStudents: Number(summary.totalStudents ?? 0),
      totalLaptops: Number(summary.totalLaptops ?? 0),
      pendingVerifications: Number(summary.activeAlerts ?? 0),
      studentsWithoutLaptops: Number(summary.studentsWithoutLaptops ?? 0),
      todayScans: Number(summary.todayScans ?? 0),
      activeAlerts: Number(summary.activeAlerts ?? 0),
      todayStudentRegistrations: Number(summary.todayStudentRegistrations ?? 0),
      todayLaptopRegistrations: Number(summary.todayLaptopRegistrations ?? 0),
    },
    // Backend does not currently expose separate lists for recent students
    // or available laptops, so leave these empty and let the UI fall back
    // to its mock data if desired.
    recentStudents: [],
    availableLaptops: [],
    alertsSummary,
    recentActivity,
  };
}
