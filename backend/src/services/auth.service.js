import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateLastLogin,
  incrementFailedLogin,
  resetFailedLogins,
  lockUser,
  changePassword,
} from "../models/user.model.js";
import {
  createSession,
  findSessionByToken,
  revokeSessionByToken,
} from "../models/session.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const MAX_FAILED_ATTEMPTS = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5);
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);

function generateJwtToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function registerUser({
  username,
  email,
  password,
  role,
  fullName,
}) {
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

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser({
    username,
    email,
    passwordHash,
    role,
    fullName,
  });
  return user;
}

export async function loginUser({ email, password, ipAddress, userAgent }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const error = new Error(
      "Account temporarily locked due to multiple failed login attempts",
    );
    error.status = 423;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    await incrementFailedLogin(user.id);

    const failed = (user.failed_login_attempts || 0) + 1;
    if (failed >= MAX_FAILED_ATTEMPTS) {
      await lockUser(user.id, LOCK_MINUTES);
    }

    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  await resetFailedLogins(user.id);
  await updateLastLogin({ userId: user.id, ipAddress });

  const token = generateJwtToken(user);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  await createSession({
    userId: user.id,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      isActive: user.is_active,
    },
  };
}

export async function logoutUser(token) {
  await revokeSessionByToken(token);
}

export async function getProfile(userId) {
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
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    isActive: user.is_active,
  };
}

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword,
}) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await changePassword(userId, newHash);
}

export async function refreshToken(oldToken) {
  const session = await findSessionByToken(oldToken);
  if (!session) {
    const error = new Error("Session not found or expired");
    error.status = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
  } catch (err) {
    const error = new Error("Invalid token");
    error.status = 401;
    throw error;
  }

  const user = await findUserById(decoded.sub);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const newToken = generateJwtToken(user);
  const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await createSession({
    userId: user.id,
    token: newToken,
    expiresAt: newExpiresAt,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
  });

  await revokeSessionByToken(oldToken);

  return { token: newToken };
}
