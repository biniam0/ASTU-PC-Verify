// Dashboard home stats and lists
export interface DashboardStats {
  totalStudents: number;
  totalLaptops: number;
  /** Active alerts used as "pending verifications" count on home */
  pendingVerifications: number;
  /** Students without any registered laptop */
  studentsWithoutLaptops?: number;
  /** Total scans made today */
  todayScans?: number;
  /** Active alerts across the system */
  activeAlerts?: number;
  /** Number of students registered today */
  todayStudentRegistrations?: number;
  /** Number of laptops registered today */
  todayLaptopRegistrations?: number;
}

export interface RecentStudent {
  id: string;
  fullName: string;
  department: string;
}

export interface AvailableLaptop {
  id: string;
  brandName: string;
  model: string;
  laptopId: string;
}

export interface AlertSummaryStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  falseAlarms: number;
}

export type DashboardActivityKind = "scan" | "alert";

export interface DashboardActivityItem {
  id: string;
  kind: DashboardActivityKind;
  studentIdentifier?: string;
  status?: string;
  type?: string;
  severity?: string;
  gateLocation?: string;
  createdAt: string | Date;
}

export interface DashboardData {
  stats: DashboardStats;
  recentStudents: RecentStudent[];
  availableLaptops: AvailableLaptop[];
  alertsSummary?: AlertSummaryStats;
  recentActivity?: DashboardActivityItem[];
}
