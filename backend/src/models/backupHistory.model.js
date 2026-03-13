import { query } from "../config/db.js";

export async function createBackupRecord({
  type,
  status,
  triggeredByUserId,
  details,
}) {
  const result = await query(
    `INSERT INTO backup_history (type, status, triggered_by_user_id, details)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [type, status, triggeredByUserId || null, details || null],
  );
  return result.rows[0];
}

export async function getLastBackup() {
  const result = await query(
    `SELECT *
     FROM backup_history
     ORDER BY triggered_at DESC
     LIMIT 1`,
  );
  return result.rows[0] || null;
}
