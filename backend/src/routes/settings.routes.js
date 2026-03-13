import express from "express";
import {
  authRequired,
  requireAnyRole,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  getSettings,
  updateSettings,
  getDepartments,
  addDepartment,
  updateDepartmentConfig,
  deleteDepartmentConfig,
  getGatesConfig,
  addGate,
  updateGateConfig,
  deleteGateConfig,
  getSecuritySettings,
  updateSecuritySettings,
  getBackupConfigAndStatus,
  triggerManualBackup,
} from "../services/settings.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

export const settingsRouter = express.Router();

// GET /api/settings - all system settings (Admin)
settingsRouter.get(
  "/",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const settings = await getSettings();
      res.json({ settings });
    } catch (err) {
      console.error("get settings error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get settings" });
    }
  },
);

// PUT /api/settings - upsert settings (Admin)
settingsRouter.put(
  "/",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const updated = await updateSettings({
        settings: req.body,
        userId: req.user.id,
      });

      await recordAuditEvent({
        req,
        action: "UPDATE",
        entityType: "setting",
        entityId: null,
        entityIdentifier: "system_settings",
        oldData: null,
        newData: updated,
        description: `System settings updated by admin ${req.user.username}`,
      });

      res.json({ settings: updated });
    } catch (err) {
      console.error("update settings error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update settings" });
    }
  },
);

// Departments

// GET /api/settings/departments - list departments (Admin, Security)
settingsRouter.get(
  "/departments",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const departments = await getDepartments();
      res.json({ departments });
    } catch (err) {
      console.error("get departments error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get departments" });
    }
  },
);

// POST /api/settings/departments - add department (Admin)
settingsRouter.post(
  "/departments",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ message: "name and code are required" });
      }
      const dept = await addDepartment({ name, code, userId: req.user.id });

      await recordAuditEvent({
        req,
        action: "CREATE",
        entityType: "setting",
        entityId: dept.id,
        entityIdentifier: `department:${dept.code}`,
        oldData: null,
        newData: dept,
        description: `Department ${dept.code} created`,
      });

      res.status(201).json({ department: dept });
    } catch (err) {
      console.error("add department error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to add department" });
    }
  },
);

// PUT /api/settings/departments/:dept - update department (Admin)
settingsRouter.put(
  "/departments/:dept",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { dept } = req.params; // department code
      const { name, newCode, isActive } = req.body;

      const updated = await updateDepartmentConfig({
        deptCode: dept,
        name,
        newCode,
        isActive,
        userId: req.user.id,
      });

      await recordAuditEvent({
        req,
        action: "UPDATE",
        entityType: "setting",
        entityId: updated.id,
        entityIdentifier: `department:${updated.code}`,
        oldData: null,
        newData: updated,
        description: `Department ${dept} updated`,
      });

      res.json({ department: updated });
    } catch (err) {
      console.error("update department error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update department" });
    }
  },
);

// DELETE /api/settings/departments/:dept - delete department (Admin)
settingsRouter.delete(
  "/departments/:dept",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { dept } = req.params; // department code

      await deleteDepartmentConfig({ deptCode: dept });

      await recordAuditEvent({
        req,
        action: "DELETE",
        entityType: "setting",
        entityId: null,
        entityIdentifier: `department:${dept}`,
        oldData: null,
        newData: null,
        description: `Department ${dept} deleted`,
      });

      res.json({ message: "Department deleted" });
    } catch (err) {
      console.error("delete department error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to delete department" });
    }
  },
);

// Gates

// GET /api/settings/gates - list gates (Admin, Security)
settingsRouter.get(
  "/gates",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const gates = await getGatesConfig();
      res.json({ gates });
    } catch (err) {
      console.error("get gates error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get gates" });
    }
  },
);

// POST /api/settings/gates - add gate (Admin)
settingsRouter.post(
  "/gates",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name, location, scannerType, ipAddress } = req.body;
      if (!name || !scannerType) {
        return res
          .status(400)
          .json({ message: "name and scannerType are required" });
      }
      const gate = await addGate({
        name,
        location,
        scannerType,
        ipAddress,
        userId: req.user.id,
      });

      await recordAuditEvent({
        req,
        action: "CREATE",
        entityType: "setting",
        entityId: gate.id,
        entityIdentifier: `gate:${gate.name}`,
        oldData: null,
        newData: gate,
        description: `Gate ${gate.name} created`,
      });

      res.status(201).json({ gate });
    } catch (err) {
      console.error("add gate error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to add gate" });
    }
  },
);

// PUT /api/settings/gates/:gateId - update gate (Admin)
settingsRouter.put(
  "/gates/:gateId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { gateId } = req.params;
      const { name, location, scannerType, ipAddress, isActive } = req.body;

      const gate = await updateGateConfig({
        gateId,
        name,
        location,
        scannerType,
        ipAddress,
        isActive,
      });

      await recordAuditEvent({
        req,
        action: "UPDATE",
        entityType: "setting",
        entityId: gate.id,
        entityIdentifier: `gate:${gate.name}`,
        oldData: null,
        newData: gate,
        description: `Gate ${gateId} updated`,
      });

      res.json({ gate });
    } catch (err) {
      console.error("update gate error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update gate" });
    }
  },
);

// DELETE /api/settings/gates/:gateId - delete gate (Admin)
settingsRouter.delete(
  "/gates/:gateId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { gateId } = req.params;

      await deleteGateConfig({ gateId });

      await recordAuditEvent({
        req,
        action: "DELETE",
        entityType: "setting",
        entityId: null,
        entityIdentifier: `gate:${gateId}`,
        oldData: null,
        newData: null,
        description: `Gate ${gateId} deleted`,
      });

      res.json({ message: "Gate deleted" });
    } catch (err) {
      console.error("delete gate error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to delete gate" });
    }
  },
);

// Security configuration

// GET /api/settings/security - security-related settings (Admin)
settingsRouter.get(
  "/security",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const rows = await getSecuritySettings();
      res.json({ settings: rows });
    } catch (err) {
      console.error("get security settings error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to get security settings",
      });
    }
  },
);

// PUT /api/settings/security - update security-related settings (Admin)
settingsRouter.put(
  "/security",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const updated = await updateSecuritySettings({
        settings: req.body,
        userId: req.user.id,
      });

      await recordAuditEvent({
        req,
        action: "UPDATE",
        entityType: "setting",
        entityId: null,
        entityIdentifier: "security_settings",
        oldData: null,
        newData: updated,
        description: `Security settings updated by admin ${req.user.username}`,
      });

      res.json({ settings: updated });
    } catch (err) {
      console.error("update security settings error", err);
      res.status(err.status || 500).json({
        message: err.message || "Failed to update security settings",
      });
    }
  },
);

// Backup configuration and status

// GET /api/settings/backup - backup config and last status (Admin)
settingsRouter.get(
  "/backup",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = await getBackupConfigAndStatus();
      res.json(data);
    } catch (err) {
      console.error("get backup settings error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get backup settings" });
    }
  },
);

// POST /api/settings/backup/manual - trigger manual backup (Admin)
settingsRouter.post(
  "/backup/manual",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const record = await triggerManualBackup({ userId: req.user.id });

      await recordAuditEvent({
        req,
        action: "CREATE",
        entityType: "setting",
        entityId: record.id,
        entityIdentifier: "backup_manual",
        oldData: null,
        newData: record,
        description: `Manual backup requested by admin ${req.user.username}`,
      });

      res.status(202).json({ backup: record });
    } catch (err) {
      console.error("manual backup error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to trigger manual backup" });
    }
  },
);
