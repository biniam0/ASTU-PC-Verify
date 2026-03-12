import { query } from "../config/db.js";

export async function createSession({
  userId,
  token,
  expiresAt,
  ipAddress,
  userAgent,
}) {
  const result = await query(
    `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, token, expires_at, ip_address, user_agent, created_at, revoked_at`,
    [userId, token, expiresAt, ipAddress, userAgent],
  );
  return result.rows[0];
}

export async function findSessionByToken(token) {
  const result = await query(
    `SELECT * FROM user_sessions
     WHERE token = $1 AND (revoked_at IS NULL) AND (expires_at IS NULL OR expires_at > NOW())`,
    [token],
  );
  return result.rows[0] || null;
}

export async function revokeSessionByToken(token) {
  await query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE token = $1 AND revoked_at IS NULL`,
    [token],
  );
}

export async function revokeAllSessionsForUser(userId) {
  await query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
