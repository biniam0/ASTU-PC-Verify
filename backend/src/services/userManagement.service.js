import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  listUsers,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  updateUser,
  updateUserStatus,
  changePassword,
  getUserActivitySummary,
} from "../models/user.model.js";
import { createPasswordResetToken } from "../models/passwordResetToken.model.js";
import { recordAuditEvent } from "./audit.service.js";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

export async function getUsers(filters) {
  return listUsers(filters);
}

function validateRole(role) {
  if (!["admin", "security"].includes(role)) {
    const error = new Error("Invalid role. Must be admin or security.");
    error.status = 400;
    throw error;
  }
}

function generateTemporaryPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

export async function createUserAccount({
  currentUserId,
  username,
  email,
  role,
  fullName,
  department,
  phone,
}) {
  validateRole(role);

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    const error = new Error("Email is already in use");
    error.status = 409;
    throw error;
  }
  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    const error = new Error("Username is already in use");
    error.status = 409;
    throw error;
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  const user = await createUser({
    username,
    email,
    passwordHash,
    role,
    fullName,
    department,
    phone,
    createdByUserId: currentUserId,
  });

  const tokenHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    createdByUserId: currentUserId,
  });

  // Audit user creation (without logging password details)
  await recordAuditEvent({
    req: null,
    action: "CREATE",
    entityType: "user",
    entityId: user.id,
    entityIdentifier: user.username,
    oldData: null,
    newData: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    description: `User ${user.username} created by admin ${currentUserId}`,
  });

  return { user, temporaryPassword };
}

export async function getUserDetails(userId) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
    department: user.department,
    phone: user.phone,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    lastLoginIp: user.last_login_ip,
    loginCount: user.login_count,
    isActive: user.is_active,
    deactivatedAt: user.deactivated_at,
    deactivationReason: user.deactivation_reason,
  };
}

export async function updateUserAccount({
  targetUserId,
  currentUserId,
  username,
  email,
  fullName,
  role,
  department,
  phone,
}) {
  if (role) {
    validateRole(role);
  }

  const existing = await findUserById(targetUserId);
  if (!existing) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (email && email !== existing.email) {
    const other = await findUserByEmail(email);
    if (other && other.id !== targetUserId) {
      const error = new Error("Email is already in use");
      error.status = 409;
      throw error;
    }
  }

  if (username && username !== existing.username) {
    const other = await findUserByUsername(username);
    if (other && other.id !== targetUserId) {
      const error = new Error("Username is already in use");
      error.status = 409;
      throw error;
    }
  }

  const updated = await updateUser({
    id: targetUserId,
    username,
    email,
    fullName,
    role,
    department,
    phone,
    updatedByUserId: currentUserId,
  });

  if (!updated) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  await recordAuditEvent({
    req: null,
    action: "UPDATE",
    entityType: "user",
    entityId: updated.id,
    entityIdentifier: updated.username,
    oldData: {
      id: existing.id,
      username: existing.username,
      email: existing.email,
      role: existing.role,
      department: existing.department,
    },
    newData: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      department: updated.department,
    },
    description: `User ${updated.username} updated by admin ${currentUserId}`,
  });

  return updated;
}

export async function updateUserStatusByAdmin({
  targetUserId,
  currentUserId,
  isActive,
  deactivationReason,
}) {
  if (!isActive && targetUserId === currentUserId) {
    const error = new Error(
      "Administrators cannot deactivate their own account",
    );
    error.status = 400;
    throw error;
  }

  if (!isActive && !deactivationReason) {
    const error = new Error(
      "Deactivation reason is required when deactivating a user",
    );
    error.status = 400;
    throw error;
  }

  const existing = await findUserById(targetUserId);
  if (!existing) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const updated = await updateUserStatus({
    id: targetUserId,
    isActive,
    deactivationReason,
    deactivatedByUserId: isActive ? null : currentUserId,
  });

  await recordAuditEvent({
    req: null,
    action: isActive ? "UPDATE" : "DELETE",
    entityType: "user",
    entityId: updated.id,
    entityIdentifier: updated.username,
    oldData: {
      id: existing.id,
      isActive: existing.is_active,
      deactivatedAt: existing.deactivated_at,
      deactivationReason: existing.deactivation_reason,
    },
    newData: {
      id: updated.id,
      isActive: updated.is_active,
      deactivatedAt: updated.deactivated_at,
      deactivationReason: updated.deactivation_reason,
    },
    description: isActive
      ? `User ${updated.username} reactivated by admin ${currentUserId}`
      : `User ${updated.username} deactivated by admin ${currentUserId}`,
  });

  return updated;
}

export async function resetUserPasswordByAdmin({
  targetUserId,
  currentUserId,
}) {
  const user = await findUserById(targetUserId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  await changePassword(targetUserId, passwordHash);

  const tokenHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createPasswordResetToken({
    userId: targetUserId,
    tokenHash,
    expiresAt,
    createdByUserId: currentUserId,
  });

  await recordAuditEvent({
    req: null,
    action: "UPDATE",
    entityType: "user",
    entityId: user.id,
    entityIdentifier: user.username,
    oldData: null,
    newData: { userId: user.id },
    description: `Password reset initiated for user ${user.username} by admin ${currentUserId}`,
  });

  return { temporaryPassword };
}

export async function getUserActivity(userId) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const summary = await getUserActivitySummary({ userId });
  return {
    userId,
    scansPerformed: Number(summary.scans_performed || 0),
    studentsRegistered: Number(summary.students_registered || 0),
    laptopsRegistered: Number(summary.laptops_registered || 0),
    alertsResolved: Number(summary.alerts_resolved || 0),
  };
}

export async function getRolesAndPermissions() {
  return [
    {
      role: "admin",
      description: "Full administrative access",
      permissions: [
        "manage_users",
        "manage_students",
        "manage_laptops",
        "manage_alerts",
        "view_logs",
        "configure_system",
      ],
    },
    {
      role: "security",
      description: "Security staff for gate operations",
      permissions: [
        "scan_ids",
        "view_students",
        "view_laptops",
        "create_alerts",
        "view_own_activity",
      ],
    },
  ];
}
