import { apiRequest } from './apiService'
import type { VerificationLogEntry, VerificationResult, VerificationStats } from '@/types/verification'

/** Fetch verification stats. Backend: GET /verification/stats */
export async function getVerificationStats(): Promise<VerificationStats> {
  return apiRequest<VerificationStats>('/verification/stats')
}

/** Fetch verification log (recent scans). Backend: GET /verification/logs */
export async function getVerificationLogs(): Promise<VerificationLogEntry[]> {
  const data = await apiRequest<VerificationLogEntry[] | undefined>('/verification/logs')
  return Array.isArray(data) ? data : []
}

/** Scan/verify by student ID. Backend: POST /verification/scan or GET /verification/verify?studentId=... */
export async function verifyByStudentId(studentId: string): Promise<VerificationResult> {
  return apiRequest<VerificationResult>('/verification/verify', {
    method: 'POST',
    body: JSON.stringify({ studentId: studentId.trim() }),
  })
}
