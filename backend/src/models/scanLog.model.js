import { prisma } from "../config/prisma.js";

export async function createScanLog({
  studentId,
  scannedStudentId,
  studentName,
  scanType,
  status,
  scannerType,
  gateLocation,
  scannedByUserId,
  ipAddress,
  userAgent,
  requestPayload,
}) {
  const log = await prisma.scan_logs.create({
    data: {
      student_id: studentId ?? null,
      scanned_student_id: scannedStudentId,
      student_name: studentName ?? null,
      scan_type: scanType ?? null,
      status,
      scanner_type: scannerType ?? null,
      gate_location: gateLocation ?? null,
      scanned_by_user_id: scannedByUserId ?? null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      request_payload: requestPayload ?? null,
    },
  });
  return log;
}

export async function updateScanLog({
  id,
  studentId,
  studentName,
  status,
  alertGenerated,
  alertId,
  responseTimeMs,
}) {
  const data = {};
  if (studentId !== undefined) data.student_id = studentId;
  if (studentName !== undefined) data.student_name = studentName;
  if (status !== undefined) data.status = status;
  if (alertGenerated !== undefined) data.alert_generated = alertGenerated;
  if (alertId !== undefined) data.alert_id = alertId;
  if (responseTimeMs !== undefined) data.response_time_ms = responseTimeMs;

  if (Object.keys(data).length === 0) {
    return getScanLogById(id);
  }

  try {
    const log = await prisma.scan_logs.update({
      where: { id },
      data,
    });
    return log;
  } catch (err) {
    if (err.code === "P2025") {
      return null;
    }
    throw err;
  }
}

export async function getScanLogById(id) {
  return prisma.scan_logs.findUnique({ where: { id } });
}

export async function listScanLogs({
  status,
  fromDate,
  toDate,
  gateLocation,
  scannedByUserId,
  page = 1,
  limit = 50,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const where = {};
  if (status) where.status = status;
  if (gateLocation) where.gate_location = gateLocation;
  if (scannedByUserId) where.scanned_by_user_id = scannedByUserId;
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) where.created_at.gte = fromDate;
    if (toDate) where.created_at.lte = toDate;
  }

  const [total, rows] = await Promise.all([
    prisma.scan_logs.count({ where }),
    prisma.scan_logs.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: safeLimit,
      skip: offset,
    }),
  ]);

  return {
    data: rows,
    pagination: {
      total,
      page: pageNumber,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function listScanLogsForStudent({ studentIdValue }) {
  const students = await prisma.students.findMany({
    where: { student_id: studentIdValue },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  return prisma.scan_logs.findMany({
    where: {
      OR: [
        { scanned_student_id: studentIdValue },
        studentIds.length
          ? { student_id: { in: studentIds } }
          : { id: { equals: "" } },
      ],
    },
    orderBy: { created_at: "desc" },
  });
}

export async function listScanLogsByDateRange({ fromDate, toDate }) {
  return prisma.scan_logs.findMany({
    where: {
      created_at: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function listTodayScanLogs() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return prisma.scan_logs.findMany({
    where: {
      created_at: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function listScanLogsByGate({ gateLocation }) {
  return prisma.scan_logs.findMany({
    where: { gate_location: gateLocation },
    orderBy: { created_at: "desc" },
  });
}

export async function listScanLogsByStaff({ userId }) {
  return prisma.scan_logs.findMany({
    where: { scanned_by_user_id: userId },
    orderBy: { created_at: "desc" },
  });
}

export async function listScanLogsByStudentDbId({ studentDbId }) {
  const idNum =
    typeof studentDbId === "string" ? parseInt(studentDbId, 10) : studentDbId;
  if (!idNum || Number.isNaN(idNum)) {
    return [];
  }

  return prisma.scan_logs.findMany({
    where: { student_id: idNum },
    orderBy: { created_at: "desc" },
  });
}

export async function getDailyScanStatistics() {
  const logs = await prisma.scan_logs.findMany({
    select: {
      created_at: true,
      status: true,
      alert_generated: true,
      gate_location: true,
    },
  });

  const byDate = new Map();

  for (const log of logs) {
    const dateKey = log.created_at.toISOString().slice(0, 10);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        date: new Date(dateKey),
        total_scans: 0,
        registered_scans: 0,
        unregistered_scans: 0,
        no_laptop_scans: 0,
        alerts_generated: 0,
        hours: new Map(),
        gates: new Map(),
      });
    }
    const entry = byDate.get(dateKey);
    entry.total_scans += 1;
    if (log.status === "registered") entry.registered_scans += 1;
    if (log.status === "unregistered") entry.unregistered_scans += 1;
    if (log.status === "no_laptops") entry.no_laptop_scans += 1;
    if (log.alert_generated) entry.alerts_generated += 1;

    const hour = log.created_at.getHours();
    entry.hours.set(hour, (entry.hours.get(hour) || 0) + 1);

    if (log.gate_location) {
      entry.gates.set(
        log.gate_location,
        (entry.gates.get(log.gate_location) || 0) + 1,
      );
    }
  }

  const result = Array.from(byDate.values()).map((entry) => {
    let peakHour = null;
    let maxHourCount = -1;
    for (const [hour, count] of entry.hours.entries()) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = hour;
      }
    }

    let busiestGate = null;
    let maxGateCount = -1;
    for (const [gate, count] of entry.gates.entries()) {
      if (count > maxGateCount) {
        maxGateCount = count;
        busiestGate = gate;
      }
    }

    return {
      date: entry.date,
      total_scans: entry.total_scans,
      registered_scans: entry.registered_scans,
      unregistered_scans: entry.unregistered_scans,
      no_laptop_scans: entry.no_laptop_scans,
      alerts_generated: entry.alerts_generated,
      peak_hour: peakHour,
      busiest_gate: busiestGate,
    };
  });

  result.sort((a, b) => b.date - a.date);
  return result;
}

export async function getHourlyScanDistribution() {
  const logs = await prisma.scan_logs.findMany({
    select: {
      created_at: true,
    },
  });

  const byDateHour = new Map();

  for (const log of logs) {
    const dateKey = log.created_at.toISOString().slice(0, 10);
    const hour = log.created_at.getHours();
    const key = `${dateKey}-${hour}`;
    const current = byDateHour.get(key) || {
      date: new Date(dateKey),
      hour,
      total_scans: 0,
    };
    current.total_scans += 1;
    byDateHour.set(key, current);
  }

  const result = Array.from(byDateHour.values());
  result.sort((a, b) => {
    if (a.date.getTime() === b.date.getTime()) {
      return a.hour - b.hour;
    }
    return b.date - a.date;
  });
  return result;
}
