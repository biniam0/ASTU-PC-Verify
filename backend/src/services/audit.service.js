import {
  createAuditLog,
  getAuditLogById,
  listAuditLogs,
  listAuditLogsForEntity,
  listAuditLogsForUser,
  listAuditLogsByAction,
  listAuditLogsByDateRange,
} from "../models/auditLog.model.js";

export async function recordAuditEvent({
  req,
  action,
  entityType,
  entityId,
  entityIdentifier,
  oldData,
  newData,
  description,
}) {
  const user = req?.user;
  const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
  const userAgent = req?.headers?.["user-agent"] || null;

  // Ensure we never log password hashes or plaintext passwords if callers accidentally pass them
  function sanitize(data) {
    if (!data) return null;
    const clone = JSON.parse(JSON.stringify(data));
    const redact = (obj) => {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        if (["password", "passwordHash", "password_hash"].includes(key)) {
          obj[key] = "***redacted***";
        } else if (obj[key] && typeof obj[key] === "object") {
          redact(obj[key]);
        }
      }
    };
    redact(clone);
    return clone;
  }

  const safeOld = sanitize(oldData);
  const safeNew = sanitize(newData);

  return createAuditLog({
    userId: user?.id || null,
    username: user?.username || null,
    userRole: user?.role || null,
    ipAddress,
    userAgent,
    action,
    entityType,
    entityId,
    entityIdentifier,
    oldData: safeOld,
    newData: safeNew,
    description,
  });
}

export async function getAuditLogs(filters) {
  return listAuditLogs(filters);
}

export async function getAuditLog(logId) {
  const log = await getAuditLogById(logId);
  if (!log) {
    const error = new Error("Audit log not found");
    error.status = 404;
    throw error;
  }
  return log;
}

export async function getAuditHistoryForEntity({ entityType, entityId }) {
  return listAuditLogsForEntity({ entityType, entityId });
}

export async function getAuditLogsForUser({ userId, page, limit }) {
  return listAuditLogsForUser({ userId, page, limit });
}

export async function getAuditLogsByAction({ action, page, limit }) {
  return listAuditLogsByAction({ action, page, limit });
}

export async function getAuditLogsByDateRange({ fromDate, toDate }) {
  return listAuditLogsByDateRange({ fromDate, toDate });
}

export async function exportAuditLogsCsv(filters) {
  const { data } = await listAuditLogs({ ...filters, page: 1, limit: 10000 });

  const header = [
    "id",
    "created_at",
    "user_id",
    "username",
    "user_role",
    "ip_address",
    "action",
    "entity_type",
    "entity_id",
    "entity_identifier",
    "description",
  ];

  const lines = [header.join(",")];

  for (const row of data) {
    const values = [
      row.id,
      row.created_at,
      row.user_id,
      row.username,
      row.user_role,
      row.ip_address,
      row.action,
      row.entity_type,
      row.entity_id,
      row.entity_identifier,
      (row.description || "").replace(/"/g, "'"),
    ];
    lines.push(
      values
        .map((v) => (v === null || v === undefined ? "" : `${v}`))
        .join(","),
    );
  }

  return lines.join("\n");
}
