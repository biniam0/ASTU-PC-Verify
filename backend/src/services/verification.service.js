import { query } from "../config/db.js";
import { createScanLog, updateScanLog } from "../models/scanLog.model.js";
import { createAlertForVerification } from "./alert.service.js";

const VERIFICATION_SQL = `
SELECT
  s.id AS student_db_id,
  s.student_id,
  s.full_name,
  s.year_of_entry,
  s.gender,
  s.department,
  s.email,
  s.phone,
  s.is_active,
  s.created_at,
  s.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', l.id,
        'brand', l.brand,
        'model', l.model,
        'serialNumber', l.serial_number,
        'macAddress', l.mac_address,
        'color', l.color,
        'purchaseYear', l.purchase_year,
        'notes', l.notes,
        'createdAt', l.created_at,
        'updatedAt', l.updated_at,
        'images', COALESCE(l.images, '[]'::json)
      )
    ) FILTER (WHERE l.id IS NOT NULL),
    '[]'::json
  ) AS laptops
FROM students s
LEFT JOIN (
  SELECT
    l.id,
    l.student_id,
    l.brand,
    l.model,
    l.serial_number,
    l.mac_address,
    l.color,
    l.purchase_year,
    l.notes,
    l.created_at,
    l.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', li.id,
          'imageType', li.image_type,
          'url', li.cloudinary_url,
          'isPrimary', li.is_primary
        ) ORDER BY li.created_at
      ) FILTER (WHERE li.id IS NOT NULL),
      '[]'::json
    ) AS images
  FROM laptops l
  LEFT JOIN laptop_images li ON li.laptop_id = l.id
  GROUP BY l.id
) l ON l.student_id = s.id
WHERE s.student_id = $1
GROUP BY s.id;
`;

async function fetchStudentSnapshot(studentId) {
  const result = await query(VERIFICATION_SQL, [studentId]);
  return result.rows[0] || null;
}

function mapStudent(row) {
  return {
    id: row.student_db_id,
    studentId: row.student_id,
    fullName: row.full_name,
    yearOfEntry: row.year_of_entry,
    gender: row.gender,
    department: row.department,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function verifyStudentId({
  studentId,
  scannerType,
  gateLocation,
  createdByUserId,
  source,
}) {
  const startedAt = Date.now();

  const initialLog = await createScanLog({
    studentId: null,
    scannedStudentId: studentId,
    studentName: null,
    scanType: source,
    status: "pending",
    scannerType,
    gateLocation,
    scannedByUserId: createdByUserId,
    ipAddress: null,
    userAgent: null,
    requestPayload: null,
  });

  const snapshot = await fetchStudentSnapshot(studentId);

  if (!snapshot) {
    const alert = await createAlertForVerification({
      type: "unregistered_id",
      scannedStudentId: studentId,
      studentId: null,
      scanLogId: initialLog.id,
      gateLocation,
      message: "Student ID not found during verification",
      createdByUserId,
    });

    const duration = Date.now() - startedAt;

    await updateScanLog({
      id: initialLog.id,
      studentId: null,
      studentName: null,
      status: "unregistered",
      alertGenerated: true,
      alertId: alert.id,
      responseTimeMs: duration,
    });

    return {
      status: "unregistered",
      message: "Student ID not found",
      studentId,
      source,
    };
  }

  const student = mapStudent(snapshot);
  const laptops = Array.isArray(snapshot.laptops) ? snapshot.laptops : [];

  if (!laptops.length) {
    const alert = await createAlertForVerification({
      type: "no_laptop",
      scannedStudentId: studentId,
      studentId: student.id,
      scanLogId: initialLog.id,
      gateLocation,
      message: "Student has no registered laptops at verification gate",
      createdByUserId,
    });

    const duration = Date.now() - startedAt;

    await updateScanLog({
      id: initialLog.id,
      studentId: student.id,
      studentName: student.fullName,
      status: "no_laptops",
      alertGenerated: true,
      alertId: alert.id,
      responseTimeMs: duration,
    });

    return {
      status: "no_laptops",
      message: "Student has no registered laptops",
      student,
      laptops: [],
      source,
    };
  }

  const duration = Date.now() - startedAt;

  await updateScanLog({
    id: initialLog.id,
    studentId: student.id,
    studentName: student.fullName,
    status: "registered",
    alertGenerated: false,
    alertId: null,
    responseTimeMs: duration,
  });

  return {
    status: "registered",
    student,
    laptops,
    source,
  };
}

export async function quickVerificationCheck({ studentId }) {
  const snapshot = await fetchStudentSnapshot(studentId);
  if (!snapshot) {
    return {
      status: "unregistered",
      studentId,
    };
  }

  const student = mapStudent(snapshot);
  const laptops = Array.isArray(snapshot.laptops) ? snapshot.laptops : [];

  return {
    status: laptops.length ? "registered" : "no_laptops",
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      department: student.department,
      yearOfEntry: student.yearOfEntry,
    },
    laptopCount: laptops.length,
  };
}
