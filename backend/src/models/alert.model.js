import { prisma } from "../config/prisma.js";

const DUPLICATE_WINDOW_MINUTES = Number(
  process.env.ALERT_DUPLICATE_WINDOW_MINUTES || 10,
);

async function getRecentActiveAlert({ type, scannedStudentId, gateLocation }) {
  const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000);

  const where = {
    type,
    scanned_student_id: scannedStudentId,
    status: "active",
    created_at: { gte: cutoff },
  };

  if (gateLocation == null) {
    where.gate_location = null;
  } else {
    where.gate_location = gateLocation;
  }

  const alert = await prisma.alerts.findFirst({
    where,
    orderBy: { created_at: "desc" },
  });
  return alert;
}

async function getRecentAlertCount24h({ type, scannedStudentId }) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.alerts.count({
    where: {
      type,
      scanned_student_id: scannedStudentId,
      created_at: { gte: cutoff },
    },
  });
  return count;
}

function calculateSeverity({ previous24hCount }) {
  if (previous24hCount >= 2) return "high"; // 3+ in 24h including new one
  return "medium"; // default for first-time incidents
}

export async function createOrIncrementAlertForScan({
  type,
  scannedStudentId,
  studentId,
  scanLogId,
  gateLocation,
  message,
  createdByUserId,
}) {
  const existing = await getRecentActiveAlert({
    type,
    scannedStudentId,
    gateLocation,
  });

  if (existing) {
    const newRepeatCount = existing.repeat_count + 1;
    const newSeverity =
      newRepeatCount >= 3 && existing.severity !== "high"
        ? "high"
        : existing.severity;

    const updated = await prisma.alerts.update({
      where: { id: existing.id },
      data: {
        repeat_count: { increment: 1 },
        severity: newSeverity,
      },
    });
    return updated;
  }

  const previous24hCount = await getRecentAlertCount24h({
    type,
    scannedStudentId,
  });
  const severity = calculateSeverity({ previous24hCount });

  const alert = await prisma.alerts.create({
    data: {
      type,
      scanned_student_id: scannedStudentId,
      student_id: studentId ?? null,
      scan_log_id: scanLogId ?? null,
      message: message ?? null,
      severity,
      status: "active",
      gate_location: gateLocation ?? null,
      repeat_count: 1,
      created_by_user_id: createdByUserId ?? null,
    },
  });
  return alert;
}

export async function getAlertById(alertId) {
  return prisma.alerts.findUnique({ where: { id: alertId } });
}

export async function listAlerts({
  type,
  status,
  fromDate,
  toDate,
  gateLocation,
  page = 1,
  limit = 20,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (gateLocation) where.gate_location = gateLocation;
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) where.created_at.gte = fromDate;
    if (toDate) where.created_at.lte = toDate;
  }

  const [total, rows] = await Promise.all([
    prisma.alerts.count({ where }),
    prisma.alerts.findMany({
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

export async function listActiveAlerts() {
  return prisma.alerts.findMany({
    where: { status: "active" },
    orderBy: { created_at: "desc" },
  });
}

export async function listAlertsForStudentIdentifier(studentIdValue) {
  const students = await prisma.students.findMany({
    where: { student_id: studentIdValue },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  return prisma.alerts.findMany({
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

export async function updateAlertStatus({
  alertId,
  newStatus,
  resolverUserId,
  resolutionNotes,
}) {
  const existing = await prisma.alerts.findUnique({ where: { id: alertId } });
  if (!existing) return null;

  let newNotes = existing.resolution_notes || "";
  if (resolutionNotes) {
    if (!newNotes) {
      newNotes = resolutionNotes;
    } else {
      newNotes = `${newNotes}\n${resolutionNotes}`;
    }
  }

  const shouldSetResolvedAt =
    newStatus === "resolved" || newStatus === "false_alarm";

  const updated = await prisma.alerts.update({
    where: { id: alertId },
    data: {
      status: newStatus,
      resolver_user_id: resolverUserId ?? null,
      resolution_notes: newNotes || null,
      resolved_at: shouldSetResolvedAt ? new Date() : existing.resolved_at,
    },
  });

  return updated;
}

export async function appendAlertNote({ alertId, note, userId }) {
  const existing = await prisma.alerts.findUnique({ where: { id: alertId } });
  if (!existing) return null;

  let newNotes = existing.resolution_notes || "";
  if (!newNotes) {
    newNotes = note;
  } else {
    newNotes = `${newNotes}\n${note}`;
  }

  const updated = await prisma.alerts.update({
    where: { id: alertId },
    data: {
      resolution_notes: newNotes,
    },
  });

  return updated;
}

export async function getAlertStatistics() {
  const [byType, resolved] = await Promise.all([
    prisma.alerts.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    prisma.alerts.findMany({
      where: { resolved_at: { not: null } },
      select: { created_at: true, resolved_at: true },
    }),
  ]);

  const countsByType = byType.map((r) => ({
    type: r.type,
    count: r._count._all,
  }));

  let avgMinutes = 0;
  let minMinutes = 0;
  let maxMinutes = 0;

  if (resolved.length > 0) {
    const minutes = resolved.map((r) => {
      const diffMs = r.resolved_at.getTime() - r.created_at.getTime();
      return diffMs / 60000;
    });
    const sum = minutes.reduce((a, b) => a + b, 0);
    avgMinutes = sum / minutes.length;
    minMinutes = Math.min(...minutes);
    maxMinutes = Math.max(...minutes);
  }

  return {
    countsByType,
    resolutionTimes: {
      avgMinutes,
      minMinutes,
      maxMinutes,
    },
  };
}
