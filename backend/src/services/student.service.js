import {
  createStudent,
  findStudentByStudentId,
  updateStudent,
  softDeleteStudent,
  listStudents,
  searchStudents,
  listStudentsByDepartment,
} from "../models/student.model.js";
import { logStudentChange } from "../models/studentAudit.model.js";

export let STUDENT_ID_REGEX = /^[0-9]{4}\/[0-9]{5}$/; // Default pattern, can be overridden via env

if (process.env.STUDENT_ID_REGEX) {
  try {
    STUDENT_ID_REGEX = new RegExp(process.env.STUDENT_ID_REGEX);
  } catch (err) {
    console.warn("Invalid STUDENT_ID_REGEX env, using default pattern");
  }
}

const DEPARTMENTS = (process.env.STUDENT_DEPARTMENTS || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

function validateDepartment(department) {
  if (!DEPARTMENTS.length) return; // no configured list, skip strict validation
  if (!DEPARTMENTS.includes(department)) {
    const error = new Error("Invalid department");
    error.status = 400;
    throw error;
  }
}

function validateStudentId(studentId) {
  if (!STUDENT_ID_REGEX.test(studentId)) {
    const error = new Error("Invalid student ID format");
    error.status = 400;
    throw error;
  }
}

export async function registerStudent({
  studentId,
  fullName,
  yearOfEntry,
  gender,
  department,
  email,
  phone,
  userId,
}) {
  validateStudentId(studentId);
  validateDepartment(department);

  const existing = await findStudentByStudentId(studentId);
  if (existing) {
    const error = new Error("Student ID already exists");
    error.status = 409;
    throw error;
  }

  const student = await createStudent({
    studentId,
    fullName,
    yearOfEntry,
    gender,
    department,
    email,
    phone,
    createdByUserId: userId,
  });

  await logStudentChange({
    studentId: student.id,
    action: "CREATE",
    beforeData: null,
    afterData: student,
    changedByUserId: userId,
  });

  return student;
}

export async function getStudentByStudentId({ studentId }) {
  const student = await findStudentByStudentId(studentId);
  if (!student) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }
  return student;
}

export async function updateStudentInfo({
  studentId,
  fullName,
  yearOfEntry,
  gender,
  department,
  email,
  phone,
  userId,
}) {
  validateDepartment(department);

  const existing = await findStudentByStudentId(studentId);
  if (!existing) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }

  const updated = await updateStudent({
    studentId,
    fullName: fullName ?? existing.full_name,
    yearOfEntry: yearOfEntry ?? existing.year_of_entry,
    gender: gender ?? existing.gender,
    department: department ?? existing.department,
    email: email ?? existing.email,
    phone: phone ?? existing.phone,
    updatedByUserId: userId,
  });

  await logStudentChange({
    studentId: existing.id,
    action: "UPDATE",
    beforeData: existing,
    afterData: updated,
    changedByUserId: userId,
  });

  return updated;
}

export async function softDeleteStudentRecord({ studentId, userId }) {
  const existing = await findStudentByStudentId(studentId);
  if (!existing) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }

  // Business rule: only soft deletion is performed here.
  const deleted = await softDeleteStudent({
    studentId,
    updatedByUserId: userId,
  });

  await logStudentChange({
    studentId: existing.id,
    action: "DELETE",
    beforeData: existing,
    afterData: deleted,
    changedByUserId: userId,
  });

  return deleted;
}

export async function listStudentsPaged({
  page = 1,
  limit = 20,
  department,
  yearOfEntry,
  isActive,
  sortBy,
  sortOrder,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const isActiveBool =
    typeof isActive === "string"
      ? isActive.toLowerCase() === "true"
      : typeof isActive === "boolean"
        ? isActive
        : undefined;

  const { total, rows } = await listStudents({
    limit: safeLimit,
    offset,
    department,
    yearOfEntry: yearOfEntry ? Number(yearOfEntry) : undefined,
    isActive: isActiveBool,
    sortBy,
    sortOrder,
  });

  return {
    data: rows,
    pagination: {
      total,
      page: pageNumber,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function searchStudentsPaged({
  q,
  department,
  yearOfEntry,
  page = 1,
  limit = 20,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const { total, rows } = await searchStudents({
    q,
    department,
    yearOfEntry: yearOfEntry ? Number(yearOfEntry) : undefined,
    limit: safeLimit,
    offset,
  });

  return {
    data: rows,
    pagination: {
      total,
      page: pageNumber,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function getStudentsByDepartment({ department }) {
  validateDepartment(department);
  const rows = await listStudentsByDepartment({ department });
  return rows;
}
