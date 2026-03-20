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

/** Result of scanning a student ID (SRS 3.1.4) */
export interface VerificationResult {
  success: boolean
  studentId: string
  studentName?: string
  department?: string
  laptop?: {
    brandName: string
    model: string
    serialNumber: string
    imageUrl?: string
    laptopId?: string
  }
  message?: string
}
