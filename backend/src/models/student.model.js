import { prisma } from "../config/prisma.js";
import { query } from "../config/db.js";

export async function createStudent({
  studentId,
  fullName,
  yearOfEntry,
  gender,
  department,
  email,
  phone,
  createdByUserId,
}) {
  const student = await prisma.students.create({
    data: {
      student_id: studentId,
      full_name: fullName,
      year_of_entry: yearOfEntry,
      gender,
      department,
      email,
      phone,
      created_by_user_id: createdByUserId ?? null,
    },
  });
  return student;
}

export async function findStudentByStudentId(studentId) {
  return prisma.students.findUnique({
    where: { student_id: studentId },
  });
}

export async function findStudentById(id) {
  return prisma.students.findUnique({ where: { id } });
}

export async function updateStudent({
  studentId,
  fullName,
  yearOfEntry,
  gender,
  department,
  email,
  phone,
  updatedByUserId,
}) {
  const student = await prisma.students.update({
    where: { student_id: studentId },
    data: {
      full_name: fullName,
      year_of_entry: yearOfEntry,
      gender,
      department,
      email,
      phone,
      updated_by_user_id: updatedByUserId ?? null,
      updated_at: new Date(),
    },
  });
  return student;
}

export async function softDeleteStudent({ studentId, updatedByUserId }) {
  const student = await prisma.students.update({
    where: { student_id: studentId },
    data: {
      is_active: false,
      updated_by_user_id: updatedByUserId ?? null,
      updated_at: new Date(),
    },
  });
  return student;
}

export async function listStudents({
  limit,
  offset,
  department,
  yearOfEntry,
  isActive,
  sortBy,
  sortOrder,
}) {
  const clauses = [];
  const values = [];
  let idx = 1;

  if (department) {
    clauses.push(`s.department = $${idx++}`);
    values.push(department);
  }
  if (yearOfEntry) {
    clauses.push(`s.year_of_entry = $${idx++}`);
    values.push(yearOfEntry);
  }
  if (typeof isActive === "boolean") {
    clauses.push(`s.is_active = $${idx++}`);
    values.push(isActive);
  }

  const validSortColumns = {
    full_name: "s.full_name",
    student_id: "s.student_id",
    year_of_entry: "s.year_of_entry",
    department: "s.department",
    created_at: "s.created_at",
  };
  const orderColumn = validSortColumns[sortBy] || "s.created_at";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) AS total
     FROM students s
     ${whereSql}`,
    values,
  );

  const dataResult = await query(
    `SELECT
       s.id,
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
       CASE WHEN COUNT(l.id) > 0 THEN 'Registered' ELSE 'Not Registered' END AS laptop_status
     FROM students s
     LEFT JOIN laptops l ON l.student_id = s.id
     ${whereSql}
     GROUP BY s.id
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );

  return {
    total: Number(countResult.rows[0]?.total || 0),
    rows: dataResult.rows,
  };
}

export async function searchStudents({
  q,
  department,
  yearOfEntry,
  limit,
  offset,
}) {
  const where = {};
  if (department) where.department = department;
  if (yearOfEntry) where.year_of_entry = yearOfEntry;
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { student_id: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.students.count({ where }),
    prisma.students.findMany({
      where,
      orderBy: { full_name: "asc" },
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, rows };
}

export async function listStudentsByDepartment({ department }) {
  const rows = await prisma.students.findMany({
    where: { department },
    orderBy: { full_name: "asc" },
  });
  return rows;
}
