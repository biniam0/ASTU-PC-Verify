import { query } from "../config/db.js";

export async function addAlertHistory({
  alertId,
  oldStatus,
  newStatus,
  changedByUserId,
  notes,
}) {
  const result = await query(
    `INSERT INTO alert_history (
       alert_id, old_status, new_status, changed_by_user_id, notes
     ) VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [alertId, oldStatus, newStatus, changedByUserId, notes],
  );
  return result.rows[0];
}

export async function getAlertHistory(alertId) {
  const result = await query(
    `SELECT *
     FROM alert_history
     WHERE alert_id = $1
     ORDER BY created_at ASC`,
    [alertId],
  );
  return result.rows;
}
