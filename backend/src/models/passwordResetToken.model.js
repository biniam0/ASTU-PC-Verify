import { query } from "../config/db.js";

export async function createPasswordResetToken({
  userId,
  tokenHash,
  expiresAt,
  createdByUserId,
}) {
  const result = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_by_user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, tokenHash, expiresAt, createdByUserId || null],
  );
  return result.rows[0];
}

export async function markPasswordResetTokenUsed({ id }) {
  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = $1`,
    [id],
  );
}

export async function findActivePasswordResetTokensForUser({ userId }) {
  const result = await query(
    `SELECT *
     FROM password_reset_tokens
     WHERE user_id = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}
