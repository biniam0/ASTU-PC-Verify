import { prisma } from "../config/prisma.js";

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
  const where = {};
  if (department) where.department = department;
  if (yearOfEntry) where.year_of_entry = yearOfEntry;
  if (typeof isActive === "boolean") where.is_active = isActive;

  const validSortColumns = [
    "full_name",
    "student_id",
    "year_of_entry",
    "department",
    "created_at",
  ];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
  const orderDirection = sortOrder === "asc" ? "asc" : "desc";

  const [total, rows] = await Promise.all([
    prisma.students.count({ where }),
    prisma.students.findMany({
      where,
      orderBy: { [orderColumn]: orderDirection },
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, rows };
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
