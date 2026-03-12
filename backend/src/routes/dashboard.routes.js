import express from "express";
import {
  authRequired,
  requireAnyRole,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  getDashboardSummary,
  getAdminDashboard,
  getSecurityDashboard,
  getRegistrationStats,
  getVerificationStats,
  getAlertStats,
  getRecentActivity,
  getRegistrationChartData,
  getScanChartData,
  getDepartmentDistributionChartData,
} from "../services/dashboard.service.js";

export const dashboardRouter = express.Router();

// GET /api/dashboard/summary - overall summary (Admin, Security)
dashboardRouter.get(
  "/summary",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const data = await getDashboardSummary();
      res.json({ summary: data });
    } catch (err) {
      console.error("dashboard summary error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get dashboard summary" });
    }
  },
);

// GET /api/dashboard/admin - admin dashboard (Admin)
dashboardRouter.get(
  "/admin",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = await getAdminDashboard();
      res.json({ dashboard: data });
    } catch (err) {
      console.error("admin dashboard error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get admin dashboard" });
    }
  },
);

// GET /api/dashboard/security - security dashboard (Security)
dashboardRouter.get(
  "/security",
  authRequired,
  requireRole("security"),
  async (req, res) => {
    try {
      const { gateLocation } = req.query;
      const data = await getSecurityDashboard({
        userId: req.user.id,
        gateLocation,
      });
      res.json({ dashboard: data });
    } catch (err) {
      console.error("security dashboard error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get security dashboard" });
    }
  },
);

// GET /api/dashboard/registrations - registration statistics (Admin)
dashboardRouter.get(
  "/registrations",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const stats = await getRegistrationStats();
      res.json({ stats });
    } catch (err) {
      console.error("dashboard registrations error", err);
      res
        .status(err.status || 500)
        .json({
          message: err.message || "Failed to get registration statistics",
        });
    }
  },
);

// GET /api/dashboard/verifications - verification statistics (Admin, Security)
dashboardRouter.get(
  "/verifications",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const stats = await getVerificationStats();
      res.json({ stats });
    } catch (err) {
      console.error("dashboard verifications error", err);
      res
        .status(err.status || 500)
        .json({
          message: err.message || "Failed to get verification statistics",
        });
    }
  },
);

// GET /api/dashboard/alerts - alert summary (Admin, Security)
dashboardRouter.get(
  "/alerts",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const stats = await getAlertStats();
      res.json({ stats });
    } catch (err) {
      console.error("dashboard alerts error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get alert statistics" });
    }
  },
);

// GET /api/dashboard/activity/recent - recent scans and alerts (Admin, Security)
dashboardRouter.get(
  "/activity/recent",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const activity = await getRecentActivity();
      res.json({ activity });
    } catch (err) {
      console.error("dashboard recent activity error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get recent activity" });
    }
  },
);

// GET /api/dashboard/charts/registrations - chart data for registrations over time (Admin)
dashboardRouter.get(
  "/charts/registrations",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = await getRegistrationChartData();
      res.json({ data });
    } catch (err) {
      console.error("dashboard charts registrations error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get registration chart data",
      });
    }
  },
);

// GET /api/dashboard/charts/scans - chart data for scans over time (Admin)
dashboardRouter.get(
  "/charts/scans",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = await getScanChartData();
      res.json({ data });
    } catch (err) {
      console.error("dashboard charts scans error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get scan chart data" });
    }
  },
);

// GET /api/dashboard/charts/departments - chart data for department distribution (Admin)
dashboardRouter.get(
  "/charts/departments",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = await getDepartmentDistributionChartData();
      res.json({ data });
    } catch (err) {
      console.error("dashboard charts departments error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get department chart data",
      });
    }
  },
);
