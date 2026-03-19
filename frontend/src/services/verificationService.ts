import { apiRequest } from './apiService'
import type { VerificationLogEntry, VerificationStats } from '@/types/verification'

/** Fetch verification stats. Backend: GET /verification/stats */
export async function getVerificationStats(): Promise<VerificationStats> {
  return apiRequest<VerificationStats>('/verification/stats')
}

/** Fetch verification log (recent scans). Backend: GET /verification/logs */
export async function getVerificationLogs(): Promise<VerificationLogEntry[]> {
  const data = await apiRequest<VerificationLogEntry[] | undefined>('/verification/logs')
  return Array.isArray(data) ? data : []
}
