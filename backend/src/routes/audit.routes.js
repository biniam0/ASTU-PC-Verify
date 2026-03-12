import express from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
  getAuditLogs,
  getAuditLog,
  getAuditHistoryForEntity,
  getAuditLogsForUser,
  getAuditLogsByAction,
  getAuditLogsByDateRange,
  exportAuditLogsCsv,
} from "../services/audit.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

export const auditRouter = express.Router();

// GET /api/audit - list audit logs with filters (Admin-only)
auditRouter.get("/", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const {
      page,
      limit,
      action,
      entityType,
      userId,
      fromDate,
      toDate,
      search,
    } = req.query;

    const logs = await getAuditLogs({
      page,
      limit,
      action,
      entityType,
      userId,
      fromDate,
      toDate,
      search,
    });

    res.json(logs);
  } catch (err) {
    console.error("list audit logs error", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to list audit logs" });
  }
});

// GET /api/audit/:logId - single audit log entry (Admin)
auditRouter.get(
  "/:logId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const log = await getAuditLog(req.params.logId);
      res.json({ log });
    } catch (err) {
      console.error("get audit log error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get audit log" });
    }
  },
);

// GET /api/audit/entity/:entityType/:entityId - history for an entity (Admin)
auditRouter.get(
  "/entity/:entityType/:entityId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await getAuditHistoryForEntity({ entityType, entityId });
      res.json({ logs });
    } catch (err) {
      console.error("get audit history error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get audit history" });
    }
  },
);

// GET /api/audit/user/:userId - logs for a specific user (Admin)
auditRouter.get(
  "/user/:userId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;
      const logs = await getAuditLogsForUser({ userId, page, limit });
      res.json({ logs });
    } catch (err) {
      console.error("get user audit logs error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get user audit logs",
      });
    }
  },
);

// GET /api/audit/date-range - logs within date range (Admin)
auditRouter.get(
  "/date-range",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      if (!fromDate || !toDate) {
        return res
          .status(400)
          .json({ message: "fromDate and toDate are required" });
      }
      const logs = await getAuditLogsByDateRange({ fromDate, toDate });
      res.json({ logs });
    } catch (err) {
      console.error("get audit logs by date range error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get audit logs by date range",
      });
    }
  },
);

// GET /api/audit/action/:action - logs for action type (Admin)
auditRouter.get(
  "/action/:action",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { action } = req.params;
      const { page, limit } = req.query;
      const logs = await getAuditLogsByAction({ action, page, limit });
      res.json({ logs });
    } catch (err) {
      console.error("get audit logs by action error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get audit logs by action",
      });
    }
  },
);

// GET /api/audit/export - CSV export for compliance reporting (Admin)
auditRouter.get(
  "/export",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { action, entityType, userId, fromDate, toDate, search } =
        req.query;
      const csv = await exportAuditLogsCsv({
        action,
        entityType,
        userId,
        fromDate,
        toDate,
        search,
      });
      await recordAuditEvent({
        req,
        action: "EXPORT",
        entityType: "other",
        entityId: null,
        entityIdentifier: "audit_logs_export",
        oldData: null,
        newData: {
          action,
          entityType,
          userId,
          fromDate,
          toDate,
          search,
        },
        description: "Exported audit logs CSV",
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit-logs.csv",
      );
      res.send(csv);
    } catch (err) {
      console.error("export audit logs error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to export audit logs" });
    }
  },
);
