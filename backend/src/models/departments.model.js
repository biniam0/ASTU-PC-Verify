import { query } from "../config/db.js";

export async function listDepartments() {
  const result = await query(
    `SELECT id, name, code, is_active, created_at, updated_at
     FROM departments
     ORDER BY name ASC`,
  );
  return result.rows;
}

export async function findDepartmentByCode(code) {
  const result = await query(`SELECT * FROM departments WHERE code = $1`, [
    code,
  ]);
  return result.rows[0] || null;
}

export async function createDepartment({ name, code, createdByUserId }) {
  const result = await query(
    `INSERT INTO departments (name, code, created_by_user_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, code, is_active, created_at, updated_at`,
    [name, code, createdByUserId || null],
  );
  return result.rows[0];
}

export async function updateDepartment({
  id,
  name,
  code,
  isActive,
  updatedByUserId,
}) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (code !== undefined) {
    fields.push(`code = $${idx++}`);
    values.push(code);
  }
  if (isActive !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(isActive);
  }
  if (updatedByUserId !== undefined) {
    fields.push(`updated_by_user_id = $${idx++}`);
    values.push(updatedByUserId);
  }

  if (!fields.length) {
    const existing = await query(`SELECT * FROM departments WHERE id = $1`, [
      id,
    ]);
    return existing.rows[0] || null;
  }

  fields.push(`updated_at = NOW()`);

  values.push(id);

  const result = await query(
    `UPDATE departments
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, name, code, is_active, created_at, updated_at`,
    values,
  );
  return result.rows[0] || null;
}

export async function deleteDepartmentById({ id }) {
  await query(`DELETE FROM departments WHERE id = $1`, [id]);
}

export async function countActiveStudentsForDepartment({ code }) {
  const result = await query(
    `SELECT COUNT(*) AS total
     FROM students
     WHERE department = $1 AND is_active = TRUE`,
    [code],
  );
  return Number(result.rows[0]?.total || 0);
}
