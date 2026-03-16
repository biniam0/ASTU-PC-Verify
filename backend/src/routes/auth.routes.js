import express from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { authValidations } from "../middleware/validation.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  changeUserPassword,
  refreshToken,
} from "../services/auth.service.js";
import { recordAuditEvent } from "../services/audit.service.js";
import { getTotalUserCount } from "../models/user.model.js";

export const authRouter = express.Router();

function extractClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
  };
}

// POST /api/auth/bootstrap-admin (Public, only when no users exist)
authRouter.post(
  "/bootstrap-admin",
  validate(authValidations.bootstrapAdmin),
  async (req, res) => {
    try {
      const totalUsers = await getTotalUserCount();
      if (totalUsers > 0) {
        return res.status(400).json({
          message: "Bootstrap admin not allowed: users already exist",
        });
      }

      const { username, email, password, fullName } = req.body;

      const user = await registerUser({
        username,
        email,
        password,
        role: "admin",
        fullName,
      });

      return res.status(201).json({
        message: "Initial admin user created",
        user,
      });
    } catch (err) {
      console.error("bootstrap-admin error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Bootstrap admin failed" });
    }
  },
);

// POST /api/auth/register (Admin only)
authRouter.post(
  "/register",
  authRequired,
  requireRole("admin"),
  validate(authValidations.register),
  async (req, res) => {
    try {
      const { username, email, password, role, fullName } = req.body;

      const user = await registerUser({
        username,
        email,
        password,
        role,
        fullName,
      });
      res.status(201).json({ user });
    } catch (err) {
      console.error("register error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Registration failed" });
    }
  },
);

// POST /api/auth/login (Public)
authRouter.post(
  "/login",
  validate(authValidations.login),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const { ipAddress, userAgent } = extractClientInfo(req);
      const result = await loginUser({ email, password, ipAddress, userAgent });

      // Successful login audit
      await recordAuditEvent({
        req,
        action: "LOGIN",
        entityType: "user",
        entityId: result.user.id,
        entityIdentifier: result.user.username,
        oldData: null,
        newData: {
          userId: result.user.id,
          username: result.user.username,
          role: result.user.role,
        },
        description: `User ${result.user.username} logged in successfully`,
      });

      res.json(result);
    } catch (err) {
      console.error("login error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Login failed" });
    }
  },
);

// POST /api/auth/logout (Authenticated)
authRouter.post("/logout", authRequired, async (req, res) => {
  try {
    await logoutUser(req.token);

    // Logout audit
    await recordAuditEvent({
      req,
      action: "LOGOUT",
      entityType: "user",
      entityId: req.user.id,
      entityIdentifier: req.user.username,
      oldData: null,
      newData: null,
      description: `User ${req.user.username} logged out`,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error", err);
    res.status(500).json({ message: "Logout failed" });
  }
});

// POST /api/auth/refresh (Authenticated using existing token)
authRouter.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const result = await refreshToken(token);
    res.json(result);
  } catch (err) {
    console.error("refresh error", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Token refresh failed" });
  }
});

// GET /api/auth/profile (Authenticated)
authRouter.get("/profile", authRequired, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    res.json({ user: profile });
  } catch (err) {
    console.error("profile error", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to get profile" });
  }
});

// PUT /api/auth/change-password (Authenticated)
authRouter.put(
  "/change-password",
  authRequired,
  validate(authValidations.changePassword),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      await changeUserPassword({
        userId: req.user.id,
        currentPassword,
        newPassword,
      });

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("change-password error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to change password" });
    }
  },
);