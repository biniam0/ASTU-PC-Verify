import { query } from "../config/db.js";

export async function listGates() {
  const result = await query(
    `SELECT id, name, location, scanner_type, ip_address, is_active, created_at, updated_at
     FROM gates
     ORDER BY name ASC`,
  );
  return result.rows;
}

export async function findGateById(id) {
  const result = await query(`SELECT * FROM gates WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createGate({
  name,
  location,
  scannerType,
  ipAddress,
  createdByUserId,
}) {
  const result = await query(
    `INSERT INTO gates (name, location, scanner_type, ip_address, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, location, scanner_type, ip_address, is_active, created_at, updated_at`,
    [
      name,
      location || null,
      scannerType,
      ipAddress || null,
      createdByUserId || null,
    ],
  );
  return result.rows[0];
}

export async function updateGate({
  id,
  name,
  location,
  scannerType,
  ipAddress,
  isActive,
}) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (location !== undefined) {
    fields.push(`location = $${idx++}`);
    values.push(location);
  }
  if (scannerType !== undefined) {
    fields.push(`scanner_type = $${idx++}`);
    values.push(scannerType);
  }
  if (ipAddress !== undefined) {
    fields.push(`ip_address = $${idx++}`);
    values.push(ipAddress);
  }
  if (isActive !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(isActive);
  }

  if (!fields.length) {
    const existing = await findGateById(id);
    return existing;
  }

  fields.push(`updated_at = NOW()`);

  values.push(id);

  const result = await query(
    `UPDATE gates
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, name, location, scanner_type, ip_address, is_active, created_at, updated_at`,
    values,
  );
  return result.rows[0] || null;
}

export async function deleteGateById({ id }) {
  await query(`DELETE FROM gates WHERE id = $1`, [id]);
}
