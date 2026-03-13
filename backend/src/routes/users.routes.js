import express from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
  getUsers,
  createUserAccount,
  getUserDetails,
  updateUserAccount,
  updateUserStatusByAdmin,
  resetUserPasswordByAdmin,
  getUserActivity,
  getRolesAndPermissions,
} from "../services/userManagement.service.js";

export const usersRouter = express.Router();

// GET /api/users - list users with pagination and filtering (Admin)
usersRouter.get("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { page, limit, role, department, isActive, search } = req.query;

    const parsedIsActive =
      typeof isActive === "string" && isActive.length
        ? isActive === "true"
        : undefined;

    const result = await getUsers({
      page,
      limit,
      role,
      department,
      isActive: parsedIsActive,
      search,
    });

    res.json(result);
  } catch (err) {
    console.error("list users error", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to list users" });
  }
});

// GET /api/users/roles/permissions - list roles and permissions (Admin)
usersRouter.get(
  "/roles/permissions",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const roles = await getRolesAndPermissions();
      res.json({ roles });
    } catch (err) {
      console.error("roles/permissions error", err);
      res
        .status(err.status || 500)
        .json({
          message: err.message || "Failed to get roles and permissions",
        });
    }
  },
);

// POST /api/users - create a new user account with temporary password (Admin)
usersRouter.post("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { username, email, role, fullName, department, phone } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({
        message: "username, email, and role are required",
      });
    }

    const { user, temporaryPassword } = await createUserAccount({
      currentUserId: req.user.id,
      username,
      email,
      role,
      fullName,
      department,
      phone,
    });

    res.status(201).json({ user, temporaryPassword });
  } catch (err) {
    console.error("create user error", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to create user" });
  }
});

// GET /api/users/:userId - get details for a specific user (Admin)
usersRouter.get(
  "/:userId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await getUserDetails(req.params.userId);
      res.json({ user });
    } catch (err) {
      console.error("get user error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get user" });
    }
  },
);

// PUT /api/users/:userId - update user information (Admin)
usersRouter.put(
  "/:userId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { username, email, fullName, role, department, phone } = req.body;

      const user = await updateUserAccount({
        targetUserId: req.params.userId,
        currentUserId: req.user.id,
        username,
        email,
        fullName,
        role,
        department,
        phone,
      });

      res.json({ user });
    } catch (err) {
      console.error("update user error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update user" });
    }
  },
);

// PUT /api/users/:userId/status - activate or deactivate a user (Admin)
usersRouter.put(
  "/:userId/status",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { isActive, deactivationReason } = req.body;

      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ message: "isActive (boolean) is required" });
      }

      const user = await updateUserStatusByAdmin({
        targetUserId: req.params.userId,
        currentUserId: req.user.id,
        isActive,
        deactivationReason,
      });

      res.json({ user });
    } catch (err) {
      console.error("update user status error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update user status" });
    }
  },
);

// POST /api/users/:userId/reset-password - reset password and generate temporary password (Admin)
usersRouter.post(
  "/:userId/reset-password",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { temporaryPassword } = await resetUserPasswordByAdmin({
        targetUserId: req.params.userId,
        currentUserId: req.user.id,
      });

      res.json({ temporaryPassword });
    } catch (err) {
      console.error("reset user password error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to reset user password" });
    }
  },
);

// GET /api/users/:userId/activity - activity summary for a specific user (Admin)
usersRouter.get(
  "/:userId/activity",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const activity = await getUserActivity(req.params.userId);
      res.json({ activity });
    } catch (err) {
      console.error("user activity error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get user activity" });
    }
  },
);
