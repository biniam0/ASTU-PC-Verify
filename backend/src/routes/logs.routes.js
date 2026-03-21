import express from "express";
import {
  authRequired,
  requireAnyRole,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  getScanLogs,
  getScanLog,
  getScanHistoryForStudent,
  getScanLogsByDateRange,
  getTodayScanLogs,
  getScanLogsByGate,
  getScanLogsByStaff,
  getDailyScanStats,
  getHourlyScanStats,
  exportScanLogsCsv,
  getScanLogsByStudentDbId,
} from "../services/scanLog.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

export const logsRouter = express.Router();

// GET /api/logs/scans - list logs with pagination/filtering (Admin)
logsRouter.get(
  "/scans",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        status,
        fromDate,
        toDate,
        gateLocation,
        scannedByUserId,
        page,
        limit,
      } = req.query;
      const result = await getScanLogs({
        status,
        fromDate,
        toDate,
        gateLocation,
        scannedByUserId,
        page,
        limit,
      });
      res.json(result);
    } catch (err) {
      console.error("list scan logs error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to list scan logs" });
    }
  },
);

// GET /api/logs/scans/:scanId - single log (Admin, Security)
logsRouter.get(
  "/scans/:scanId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { scanId } = req.params;
      const log = await getScanLog(scanId);
      res.json({ log });
    } catch (err) {
      console.error("get scan log error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get scan log" });
    }
  },
);

// GET /api/logs/scans/student/:studentId - student history (Admin, Security)
logsRouter.get(
  "/scans/student/:studentId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const logs = await getScanHistoryForStudent({ studentId });
      res.json({ logs });
    } catch (err) {
      console.error("scan history by student error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get scan history" });
    }
  },
);

// GET /api/logs/scans/date-range - scans within date range (Admin)
logsRouter.get(
  "/scans/date-range",
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
      const logs = await getScanLogsByDateRange({ fromDate, toDate });
      res.json({ logs });
    } catch (err) {
      console.error("scan logs date-range error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get scan logs by date range",
      });
    }
  },
);

// GET /api/logs/scans/today - today's scans (Admin, Security)
logsRouter.get(
  "/scans/today",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const logs = await getTodayScanLogs();
      res.json({ logs });
    } catch (err) {
      console.error("today scan logs error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get today's scan logs" });
    }
  },
);

// GET /api/logs/scans/gate/:gateLocation - by gate (Admin)
logsRouter.get(
  "/scans/gate/:gateLocation",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { gateLocation } = req.params;
      const logs = await getScanLogsByGate({ gateLocation });
      res.json({ logs });
    } catch (err) {
      console.error("scan logs by gate error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get scan logs by gate" });
    }
  },
);

// GET /api/logs/scans/staff/:userId - by staff (Admin)
logsRouter.get(
  "/scans/staff/:userId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const logs = await getScanLogsByStaff({ userId });
      res.json({ logs });
    } catch (err) {
      console.error("scan logs by staff error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get scan logs by staff" });
    }
  },
);

// GET /api/logs/scans/student-db/:studentDbId - by student DB id (Admin, Security)
logsRouter.get(
  "/scans/student-db/:studentDbId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentDbId } = req.params;
      const logs = await getScanLogsByStudentDbId({ studentDbId });
      res.json({ logs });
    } catch (err) {
      console.error("scan logs by studentDbId error", err);
      res.status(err.status || 500).json({
        message:
          err.message || "Failed to get scan logs by student database id",
      });
    }
  },
);

// GET /api/logs/scans/statistics/daily - daily stats (Admin)
logsRouter.get(
  "/scans/statistics/daily",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const stats = await getDailyScanStats();
      res.json({ stats });
    } catch (err) {
      console.error("daily scan statistics error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get daily scan statistics",
      });
    }
  },
);

// GET /api/logs/scans/statistics/hourly - hourly distribution (Admin)
logsRouter.get(
  "/scans/statistics/hourly",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const stats = await getHourlyScanStats();
      res.json({ stats });
    } catch (err) {
      console.error("hourly scan statistics error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get hourly scan statistics",
      });
    }
  },
);

// GET /api/logs/scans/export - CSV export (Admin)
logsRouter.get(
  "/scans/export",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { status, fromDate, toDate, gateLocation, scannedByUserId } =
        req.query;
      const csv = await exportScanLogsCsv({
        status,
        fromDate,
        toDate,
        gateLocation,
        scannedByUserId,
      });

      await recordAuditEvent({
        req,
        action: "EXPORT",
        entityType: "scan",
        entityId: null,
        entityIdentifier: "scan_logs_export",
        oldData: null,
        newData: {
          status,
          fromDate,
          toDate,
          gateLocation,
          scannedByUserId,
        },
        description: "Exported scan logs CSV",
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=scan-logs.csv",
      );
      res.send(csv);
    } catch (err) {
      console.error("export scan logs error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to export scan logs" });
    }
  },
);
