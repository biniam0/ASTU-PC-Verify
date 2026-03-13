import { prisma } from "../config/prisma.js";

export async function createUser({
  username,
  email,
  passwordHash,
  role,
  fullName,
  department,
  phone,
  createdByUserId,
}) {
  const user = await prisma.users.create({
    data: {
      username,
      email,
      password_hash: passwordHash,
      role,
      full_name: fullName,
      department: department ?? null,
      phone: phone ?? null,
      created_by_user_id: createdByUserId ?? null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      full_name: true,
      department: true,
      phone: true,
      created_at: true,
      last_login_at: true,
      last_login_ip: true,
      login_count: true,
      is_active: true,
    },
  });
  return user;
}

export async function findUserByEmail(email) {
  return prisma.users.findUnique({ where: { email } });
}

export async function findUserById(id) {
  return prisma.users.findUnique({ where: { id } });
}

export async function findUserByUsername(username) {
  return prisma.users.findUnique({ where: { username } });
}

export async function getTotalUserCount() {
  return prisma.users.count();
}

export async function updateLastLogin({ userId, ipAddress }) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      last_login_at: new Date(),
      last_login_ip: ipAddress ?? null,
      login_count: {
        increment: 1,
      },
    },
  });
}

export async function incrementFailedLogin(userId) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      failed_login_attempts: { increment: 1 },
      last_failed_login_at: new Date(),
    },
  });
}

export async function resetFailedLogins(userId) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      failed_login_attempts: 0,
      locked_until: null,
    },
  });
}

export async function lockUser(userId, minutes = 15) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + minutes * 60 * 1000);
  await prisma.users.update({
    where: { id: userId },
    data: {
      locked_until: lockedUntil,
    },
  });
}

export async function changePassword(userId, newPasswordHash) {
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: newPasswordHash },
  });
}

export async function listUsers({
  page = 1,
  limit = 50,
  role,
  isActive,
  department,
  search,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const offset = (pageNumber - 1) * safeLimit;

  const where = {};
  if (role) where.role = role;
  if (typeof isActive === "boolean") where.is_active = isActive;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { full_name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: safeLimit,
      skip: offset,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        full_name: true,
        department: true,
        phone: true,
        created_at: true,
        last_login_at: true,
        last_login_ip: true,
        login_count: true,
        is_active: true,
        deactivated_at: true,
        deactivation_reason: true,
      },
    }),
  ]);

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

export async function updateUser({
  id,
  username,
  email,
  fullName,
  role,
  department,
  phone,
  updatedByUserId,
}) {
  const data = {};
  if (username !== undefined) data.username = username;
  if (email !== undefined) data.email = email;
  if (fullName !== undefined) data.full_name = fullName;
  if (role !== undefined) data.role = role;
  if (department !== undefined) data.department = department;
  if (phone !== undefined) data.phone = phone;
  if (updatedByUserId !== undefined) data.updated_by_user_id = updatedByUserId;

  if (Object.keys(data).length === 0) {
    return findUserById(id);
  }

  const user = await prisma.users.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      full_name: true,
      department: true,
      phone: true,
      created_at: true,
      last_login_at: true,
      last_login_ip: true,
      login_count: true,
      is_active: true,
      deactivated_at: true,
      deactivation_reason: true,
    },
  });

  return user;
}

export async function updateUserStatus({
  id,
  isActive,
  deactivationReason,
  deactivatedByUserId,
}) {
  if (isActive) {
    const user = await prisma.users.update({
      where: { id },
      data: {
        is_active: true,
        deactivated_at: null,
        deactivation_reason: null,
        deactivated_by_user_id: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        full_name: true,
        department: true,
        phone: true,
        created_at: true,
        last_login_at: true,
        last_login_ip: true,
        login_count: true,
        is_active: true,
        deactivated_at: true,
        deactivation_reason: true,
      },
    });
    return user;
  }

  const user = await prisma.users.update({
    where: { id },
    data: {
      is_active: false,
      deactivated_at: new Date(),
      deactivation_reason: deactivationReason ?? null,
      deactivated_by_user_id: deactivatedByUserId ?? null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      full_name: true,
      department: true,
      phone: true,
      created_at: true,
      last_login_at: true,
      last_login_ip: true,
      login_count: true,
      is_active: true,
      deactivated_at: true,
      deactivation_reason: true,
    },
  });
  return user;
}

export async function getUserActivitySummary({ userId }) {
  const [scans, students, laptops, alerts] = await Promise.all([
    prisma.scan_logs.count({ where: { scanned_by_user_id: userId } }),
    prisma.students.count({ where: { created_by_user_id: userId } }),
    prisma.laptops.count({ where: { created_by_user_id: userId } }),
    prisma.alerts.count({
      where: { resolver_user_id: userId, status: "resolved" },
    }),
  ]);

  return {
    scans_performed: scans,
    students_registered: students,
    laptops_registered: laptops,
    alerts_resolved: alerts,
  };
}
