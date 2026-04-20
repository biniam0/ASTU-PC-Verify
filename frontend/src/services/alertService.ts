import { apiRequest } from "./apiService";

export type AlertStatus = "active" | "resolved" | "false_alarm" | string;
export type AlertType =
  | "unregistered_id"
  | "no_laptop"
  | "suspicious_activity"
  | string;

export interface AlertListParams {
  status?: AlertStatus;
  type?: AlertType;
  fromDate?: string; // ISO date (YYYY-MM-DD)
  toDate?: string; // ISO date (YYYY-MM-DD)
  gateLocation?: string;
  page?: number;
  limit?: number;
}

export interface AlertItem {
  id: string;
  type: string;
  status: AlertStatus;
  severity?: string | null;
  gateLocation?: string | null;
  studentId?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  message?: string | null;
}

export interface AlertListResult {
  alerts: AlertItem[];
  total?: number;
  page?: number;
  limit?: number;
}

function mapAlertRow(row: any): AlertItem {
  return {
    id: String(row.id),
    type: row.type ?? "unknown",
    status: row.status ?? "active",
    severity: row.severity ?? null,
    gateLocation: row.gate_location ?? row.gateLocation ?? null,
    studentId:
      row.student_id != null
        ? String(row.student_id)
        : (row.studentId ?? row.student_identifier ?? null),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
    message: row.message ?? row.description ?? null,
  };
}

export async function listAlerts(
  params: AlertListParams = {},
): Promise<AlertListResult> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", String(params.status));
  if (params.type) query.set("type", String(params.type));
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.gateLocation) query.set("gateLocation", params.gateLocation);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await apiRequest<any>(
    `/alerts${query.toString() ? `?${query.toString()}` : ""}`,
  );

  const rawAlerts: any[] =
    res?.alerts ?? res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
  const alerts = Array.isArray(rawAlerts)
    ? rawAlerts.map((row) => mapAlertRow(row))
    : [];

  const pagination = res?.pagination ?? {};
  return {
    alerts,
    total: pagination.total ?? alerts.length,
    page: pagination.page ?? params.page ?? 1,
    limit: (pagination.limit ?? params.limit ?? alerts.length) || 20,
  };
}

export async function resolveAlert(
  alertId: string,
  notes: string,
): Promise<AlertItem> {
  const res = await apiRequest<{ alert?: any }>(
    `/alerts/${encodeURIComponent(alertId)}/resolve`,
    {
      method: "PUT",
      body: JSON.stringify({ notes }),
    },
  );
  const row = res?.alert ?? res;
  return mapAlertRow(row);
}

export async function markAlertFalseAlarm(
  alertId: string,
  notes?: string,
): Promise<AlertItem> {
  const res = await apiRequest<{ alert?: any }>(
    `/alerts/${encodeURIComponent(alertId)}/false-alarm`,
    {
      method: "PUT",
      body: JSON.stringify({ notes }),
    },
  );
  const row = res?.alert ?? res;
  return mapAlertRow(row);
}

export async function addAlertNote(
  alertId: string,
  note: string,
): Promise<void> {
  await apiRequest(`/alerts/${encodeURIComponent(alertId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
