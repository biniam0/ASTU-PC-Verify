import { query } from "../config/db.js";

export async function getCachedMetric({ key }) {
  const result = await query(
    `SELECT payload
     FROM cached_dashboard_metrics
     WHERE key = $1
       AND valid_until > NOW()`,
    [key],
  );
  if (!result.rows[0]) {
    return null;
  }
  return result.rows[0].payload;
}

export async function setCachedMetric({ key, payload, ttlSeconds }) {
  const result = await query(
    `INSERT INTO cached_dashboard_metrics (key, payload, valid_until)
     VALUES ($1, $2, NOW() + ($3 || ' seconds')::interval)
     ON CONFLICT (key)
     DO UPDATE SET
       payload = EXCLUDED.payload,
       valid_until = EXCLUDED.valid_until,
       updated_at = NOW()
     RETURNING payload`,
    [key, payload, String(ttlSeconds)],
  );
  return result.rows[0].payload;
}
