import {
  listScanLogs,
  getScanLogById,
  listScanLogsForStudent,
  listScanLogsByDateRange,
  listTodayScanLogs,
  listScanLogsByGate,
  listScanLogsByStaff,
  getDailyScanStatistics,
  getHourlyScanDistribution,
} from "../models/scanLog.model.js";

export async function getScanLogs(filters) {
  return listScanLogs(filters);
}

export async function getScanLog(scanId) {
  const log = await getScanLogById(scanId);
  if (!log) {
    const error = new Error("Scan log not found");
    error.status = 404;
    throw error;
  }
  return log;
}

export async function getScanHistoryForStudent({ studentId }) {
  return listScanLogsForStudent({ studentIdValue: studentId });
}

export async function getScanLogsByDateRange({ fromDate, toDate }) {
  return listScanLogsByDateRange({ fromDate, toDate });
}

export async function getTodayScanLogs() {
  return listTodayScanLogs();
}

export async function getScanLogsByGate({ gateLocation }) {
  return listScanLogsByGate({ gateLocation });
}

export async function getScanLogsByStaff({ userId }) {
  return listScanLogsByStaff({ userId });
}

export async function getDailyScanStats() {
  return getDailyScanStatistics();
}

export async function getHourlyScanStats() {
  return getHourlyScanDistribution();
}

export async function exportScanLogsCsv(filters) {
  const { data } = await listScanLogs({ ...filters, page: 1, limit: 10000 });

  const header = [
    "id",
    "student_id",
    "scanned_student_id",
    "student_name",
    "scan_type",
    "status",
    "scanner_type",
    "gate_location",
    "scanned_by_user_id",
    "alert_generated",
    "alert_id",
    "ip_address",
    "user_agent",
    "response_time_ms",
    "created_at",
  ];

  const lines = [header.join(",")];

  for (const row of data) {
    const values = [
      row.id,
      row.student_id,
      row.scanned_student_id,
      row.student_name,
      row.scan_type,
      row.status,
      row.scanner_type,
      row.gate_location,
      row.scanned_by_user_id,
      row.alert_generated,
      row.alert_id,
      row.ip_address,
      (row.user_agent || "").replace(/"/g, "'"),
      row.response_time_ms,
      row.created_at,
    ];
    lines.push(
      values
        .map((v) => (v === null || v === undefined ? "" : `${v}`))
        .join(","),
    );
  }

  return lines.join("\n");
}
