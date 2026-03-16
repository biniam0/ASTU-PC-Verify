import { query } from "../config/db.js";

export async function createAuditLog({
  userId,
  username,
  userRole,
  ipAddress,
  userAgent,
  action,
  entityType,
  entityId,
  entityIdentifier,
  oldData,
  newData,
  description,
}) {
  const result = await query(
    `INSERT INTO audit_logs (
       user_id,
       username,
       user_role,
       ip_address,
       user_agent,
       action,
       entity_type,
       entity_id,
       entity_identifier,
       old_data,
       new_data,
       description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      userId || null,
      username || null,
      userRole || null,
      ipAddress || null,
      userAgent || null,
      action,
      entityType,
      entityId || null,
      entityIdentifier || null,
      oldData ?? null,
      newData ?? null,
      description || null,
    ],
  );
  return result.rows[0];
}

export async function getAuditLogById(id) {
  const result = await query(`SELECT * FROM audit_logs WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function listAuditLogs({
  page = 1,
  limit = 50,
  action,
  entityType,
  userId,
  fromDate,
  toDate,
  search,
}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (action) {
    conditions.push(`action = $${idx++}`);
    values.push(action);
  }
  if (entityType) {
    conditions.push(`entity_type = $${idx++}`);
    values.push(entityType);
  }
  if (userId) {
    conditions.push(`user_id = $${idx++}`);
    values.push(userId);
  }
  if (fromDate) {
    conditions.push(`created_at >= $${idx++}`);
    values.push(fromDate);
  }
  if (toDate) {
    conditions.push(`created_at <= $${idx++}`);
    values.push(toDate);
  }
  if (search) {
    conditions.push(
      `(entity_identifier ILIKE $${idx} OR description ILIKE $${idx})`,
    );
    values.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`,
    values,
  );
  const total = Number(countResult.rows[0]?.total || 0);

  values.push(safeLimit);
  values.push(offset);

  const result = await query(
    `SELECT *
     FROM audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx++}
     OFFSET $${idx++}`,
    values,
  );

  return {
    data: result.rows,
    pagination: {
      total,
      page: pageNumber,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function listAuditLogsForEntity({ entityType, entityId }) {
  const result = await query(
    `SELECT *
     FROM audit_logs
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC`,
    [entityType, entityId],
  );
  return result.rows;
}

export async function listAuditLogsForUser({ userId, page = 1, limit = 50 }) {
  return listAuditLogs({ userId, page, limit });
}

export async function listAuditLogsByAction({ action, page = 1, limit = 50 }) {
  return listAuditLogs({ action, page, limit });
}

export async function listAuditLogsByDateRange({ fromDate, toDate }) {
  const result = await query(
    `SELECT *
     FROM audit_logs
     WHERE created_at >= $1 AND created_at <= $2
     ORDER BY created_at DESC`,
    [fromDate, toDate],
  );
  return result.rows;
}
