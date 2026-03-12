import { query } from "../config/db.js";

export async function logStudentChange({
  studentId,
  action,
  beforeData,
  afterData,
  changedByUserId,
}) {
  await query(
    `INSERT INTO student_audit_logs (
       student_id, action, before_data, after_data, changed_by_user_id
     ) VALUES ($1,$2,$3,$4,$5)`,
    [studentId, action, beforeData, afterData, changedByUserId],
  );
}
