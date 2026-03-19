// Verification stats (SRS 3.1.4, 3.1.5)
export interface VerificationStats {
  totalScan: number
  verified: number
  alerts: number
}

export interface VerificationLogEntry {
  id: string
  studentId: string
  studentName?: string
  timestamp: string
  result: 'verified' | 'alert'
  message?: string
}
