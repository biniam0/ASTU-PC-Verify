// Dashboard home stats and lists
export interface DashboardStats {
  totalStudents: number
  totalLaptops: number
  pendingVerifications: number
}

export interface RecentStudent {
  id: string
  fullName: string
  department: string
}

export interface AvailableLaptop {
  id: string
  brandName: string
  model: string
  laptopId: string
}

export interface DashboardData {
  stats: DashboardStats
  recentStudents: RecentStudent[]
  availableLaptops: AvailableLaptop[]
}
