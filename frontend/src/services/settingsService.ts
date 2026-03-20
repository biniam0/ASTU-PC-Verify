import { apiRequest } from './apiService'

export interface Department {
  id: string
  name: string
  code: string
  is_active: boolean
}

export interface GateConfig {
  id: string
  name: string
  location?: string | null
  scanner_type: string
  ip_address?: string | null
  is_active: boolean
}

export interface SecuritySettingRow {
  key: string
  value: unknown
}

export interface BackupConfigAndStatus {
  config: Record<string, unknown>
  lastBackup: {
    id: string
    type: string
    status: string
    triggered_at: string
    completed_at?: string | null
  } | null
}

export async function getDepartments(): Promise<Department[]> {
  const res = await apiRequest<{ departments?: Department[] }>('/settings/departments')
  return Array.isArray(res?.departments) ? res.departments : []
}

export async function addDepartment(payload: { name: string; code: string }): Promise<Department> {
  const res = await apiRequest<{ department: Department }>('/settings/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res?.department) throw new Error('Failed to create department')
  return res.department
}

export async function updateDepartment(
  deptCode: string,
  payload: { name?: string; newCode?: string; isActive?: boolean },
): Promise<Department> {
  const res = await apiRequest<{ department: Department }>(`/settings/departments/${encodeURIComponent(deptCode)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  if (!res?.department) throw new Error('Failed to update department')
  return res.department
}

export async function deleteDepartment(code: string): Promise<void> {
  await apiRequest<{ message: string }>(`/settings/departments/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
}

export async function getGates(): Promise<GateConfig[]> {
  const res = await apiRequest<{ gates?: GateConfig[] }>('/settings/gates')
  return Array.isArray(res?.gates) ? res.gates : []
}

export async function addGate(payload: {
  name: string
  location?: string
  scannerType: string
  ipAddress?: string
}): Promise<GateConfig> {
  const res = await apiRequest<{ gate: GateConfig }>('/settings/gates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res?.gate) throw new Error('Failed to create gate')
  return res.gate
}

export async function updateGate(
  gateId: string,
  payload: { name?: string; location?: string; scannerType?: string; ipAddress?: string; isActive?: boolean },
): Promise<GateConfig> {
  const res = await apiRequest<{ gate: GateConfig }>(`/settings/gates/${encodeURIComponent(gateId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  if (!res?.gate) throw new Error('Failed to update gate')
  return res.gate
}

export async function deleteGate(gateId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/settings/gates/${encodeURIComponent(gateId)}`, {
    method: 'DELETE',
  })
}

export async function getSecuritySettings(): Promise<SecuritySettingRow[]> {
  const res = await apiRequest<{ settings?: SecuritySettingRow[] }>('/settings/security')
  return Array.isArray(res?.settings) ? res.settings : []
}

export async function updateSecuritySettings(settings: Record<string, unknown>): Promise<SecuritySettingRow[]> {
  const res = await apiRequest<{ settings?: SecuritySettingRow[] }>('/settings/security', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  return Array.isArray(res?.settings) ? res.settings : []
}

export async function getBackupConfig(): Promise<BackupConfigAndStatus> {
  const res = await apiRequest<BackupConfigAndStatus>('/settings/backup')
  return res
}

export async function triggerManualBackup(): Promise<{ id: string; status: string }> {
  const res = await apiRequest<{ backup: { id: string; status: string } }>('/settings/backup/manual', {
    method: 'POST',
  })
  if (!res?.backup) throw new Error('Failed to request manual backup')
  return { id: res.backup.id, status: res.backup.status }
}
