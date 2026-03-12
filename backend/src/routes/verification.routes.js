import express from "express";
import { authRequired, requireAnyRole } from "../middleware/auth.middleware.js";
import {
  verifyStudentId,
  quickVerificationCheck,
} from "../services/verification.service.js";

export const verificationRouter = express.Router();

function getScannerMeta(req) {
  const { scannerType, gateLocation } = req.body || {};
  return {
    scannerType: scannerType || "unknown",
    gateLocation: gateLocation || null,
  };
}

// POST /api/verification/scan - scanned ID (Security)
verificationRouter.post(
  "/scan",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentId } = req.body || {};
      if (!studentId) {
        return res
          .status(400)
          .json({ message: "studentId is required for verification" });
      }

      const meta = getScannerMeta(req);
      const result = await verifyStudentId({
        studentId,
        scannerType: meta.scannerType,
        gateLocation: meta.gateLocation,
        createdByUserId: req.user.id,
        source: "scan",
      });

      res.json(result);
    } catch (err) {
      console.error("verification scan error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Verification scan failed" });
    }
  },
);

// POST /api/verification/manual - manual ID entry (Security)
verificationRouter.post(
  "/manual",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentId, gateLocation } = req.body || {};
      if (!studentId) {
        return res
          .status(400)
          .json({ message: "studentId is required for verification" });
      }

      const result = await verifyStudentId({
        studentId,
        scannerType: "manual",
        gateLocation: gateLocation || null,
        createdByUserId: req.user.id,
        source: "manual",
      });

      res.json(result);
    } catch (err) {
      console.error("verification manual error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Manual verification failed" });
    }
  },
);

// GET /api/verification/check/:studentId - quick minimal check (Security)
verificationRouter.get(
  "/check/:studentId",
  authRequired,
  requireAnyRole(["security", "admin"]),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const result = await quickVerificationCheck({ studentId });
      res.json(result);
    } catch (err) {
      console.error("verification check error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Verification check failed" });
    }
  },
);
