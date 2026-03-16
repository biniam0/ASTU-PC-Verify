import express from "express";
import {
  authRequired,
  requireAnyRole,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  getAlertsWithFilters,
  getActiveAlerts,
  getAlertDetails,
  resolveAlert,
  addAlertNote,
  getAlertStats,
  getAlertsForStudent,
} from "../services/alert.service.js";

export const alertsRouter = express.Router();

// GET /api/alerts - list with filters
alertsRouter.get(
  "/",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { type, status, fromDate, toDate, gateLocation, page, limit } =
        req.query;
      const result = await getAlertsWithFilters({
        type,
        status,
        fromDate,
        toDate,
        gateLocation,
        page,
        limit,
      });
      res.json(result);
    } catch (err) {
      console.error("list alerts error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to list alerts" });
    }
  },
);

// GET /api/alerts/active - active & unresolved alerts
alertsRouter.get(
  "/active",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const alerts = await getActiveAlerts();
      res.json({ alerts });
    } catch (err) {
      console.error("active alerts error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get active alerts" });
    }
  },
);

// GET /api/alerts/:alertId - alert details
alertsRouter.get(
  "/:alertId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const result = await getAlertDetails(alertId);
      res.json(result);
    } catch (err) {
      console.error("get alert error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get alert" });
    }
  },
);

// PUT /api/alerts/:alertId/resolve - resolve alert with notes
alertsRouter.put(
  "/:alertId/resolve",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body || {};
      if (!notes) {
        return res
          .status(400)
          .json({ message: "Resolution notes are required" });
      }

      const updated = await resolveAlert({
        alertId,
        userId: req.user.id,
        notes,
        isFalseAlarm: false,
      });
      res.json({ alert: updated });
    } catch (err) {
      console.error("resolve alert error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to resolve alert" });
    }
  },
);

// PUT /api/alerts/:alertId/false-alarm - mark false alarm
alertsRouter.put(
  "/:alertId/false-alarm",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body || {};

      const updated = await resolveAlert({
        alertId,
        userId: req.user.id,
        notes: notes || "Marked as false alarm",
        isFalseAlarm: true,
      });
      res.json({ alert: updated });
    } catch (err) {
      console.error("false-alarm alert error", err);
      res
        .status(err.status || 500)
        .json({
          message: err.message || "Failed to mark alert as false alarm",
        });
    }
  },
);

// POST /api/alerts/:alertId/notes - add note
alertsRouter.post(
  "/:alertId/notes",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { note } = req.body || {};
      if (!note) {
        return res.status(400).json({ message: "Note text is required" });
      }

      const updated = await addAlertNote({
        alertId,
        userId: req.user.id,
        note,
      });
      res.json({ alert: updated });
    } catch (err) {
      console.error("add alert note error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to add alert note" });
    }
  },
);

// GET /api/alerts/statistics - admin only
alertsRouter.get(
  "/statistics",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const stats = await getAlertStats();
      res.json(stats);
    } catch (err) {
      console.error("alert statistics error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get alert statistics" });
    }
  },
);

// GET /api/alerts/student/:studentId - alerts for student
alertsRouter.get(
  "/student/:studentId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const alerts = await getAlertsForStudent({ studentId });
      res.json({ alerts });
    } catch (err) {
      console.error("alerts by student error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get alerts for student" });
    }
  },
);
