import {
  getAllSettings,
  upsertSettings,
  getSettingsByPrefix,
  getSettingsByKeys,
} from "../models/systemSettings.model.js";
import {
  listDepartments,
  findDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartmentById,
  countActiveStudentsForDepartment,
} from "../models/departments.model.js";
import {
  listGates,
  findGateById,
  createGate,
  updateGate,
  deleteGateById,
} from "../models/gates.model.js";
import {
  createBackupRecord,
  getLastBackup,
} from "../models/backupHistory.model.js";

export async function getSettings() {
  return getAllSettings();
}

export async function updateSettings({ settings, userId }) {
  if (!Array.isArray(settings)) {
    const asArray = Object.entries(settings || {}).map(([key, value]) => ({
      key,
      value,
      description: null,
      dataType: null,
    }));
    return upsertSettings({ settings: asArray, updatedByUserId: userId });
  }
  return upsertSettings({ settings, updatedByUserId: userId });
}

export async function getDepartments() {
  return listDepartments();
}

export async function addDepartment({ name, code, userId }) {
  const existing = await findDepartmentByCode(code);
  if (existing) {
    const error = new Error("Department code already exists");
    error.status = 409;
    throw error;
  }
  return createDepartment({ name, code, createdByUserId: userId });
}

export async function updateDepartmentConfig({
  deptCode,
  name,
  newCode,
  isActive,
  userId,
}) {
  const existing = await findDepartmentByCode(deptCode);
  if (!existing) {
    const error = new Error("Department not found");
    error.status = 404;
    throw error;
  }

  if (newCode && newCode !== existing.code) {
    const other = await findDepartmentByCode(newCode);
    if (other) {
      const error = new Error("New department code already exists");
      error.status = 409;
      throw error;
    }
  }

  return updateDepartment({
    id: existing.id,
    name,
    code: newCode,
    isActive,
    updatedByUserId: userId,
  });
}

export async function deleteDepartmentConfig({ deptCode }) {
  const existing = await findDepartmentByCode(deptCode);
  if (!existing) {
    const error = new Error("Department not found");
    error.status = 404;
    throw error;
  }

  const activeStudents = await countActiveStudentsForDepartment({
    code: existing.code,
  });
  if (activeStudents > 0) {
    const error = new Error(
      "Department cannot be deleted while it has active students",
    );
    error.status = 409;
    throw error;
  }

  await deleteDepartmentById({ id: existing.id });
}

export async function getGatesConfig() {
  return listGates();
}

export async function addGate({
  name,
  location,
  scannerType,
  ipAddress,
  userId,
}) {
  if (!["barcode", "qr", "rfid", "manual"].includes(scannerType)) {
    const error = new Error("Invalid scanner type");
    error.status = 400;
    throw error;
  }
  return createGate({
    name,
    location,
    scannerType,
    ipAddress,
    createdByUserId: userId,
  });
}

export async function updateGateConfig({
  gateId,
  name,
  location,
  scannerType,
  ipAddress,
  isActive,
}) {
  const existing = await findGateById(gateId);
  if (!existing) {
    const error = new Error("Gate not found");
    error.status = 404;
    throw error;
  }

  if (
    scannerType &&
    !["barcode", "qr", "rfid", "manual"].includes(scannerType)
  ) {
    const error = new Error("Invalid scanner type");
    error.status = 400;
    throw error;
  }

  return updateGate({
    id: gateId,
    name,
    location,
    scannerType,
    ipAddress,
    isActive,
  });
}

export async function deleteGateConfig({ gateId }) {
  const existing = await findGateById(gateId);
  if (!existing) {
    const error = new Error("Gate not found");
    error.status = 404;
    throw error;
  }
  await deleteGateById({ id: gateId });
}

export async function getSecuritySettings() {
  const rows = await getSettingsByPrefix("security.");
  return rows;
}

export async function updateSecuritySettings({ settings, userId }) {
  const normalized = Object.entries(settings || {}).map(([suffix, value]) => ({
    key: `security.${suffix}`,
    value,
    description: null,
    dataType: null,
  }));
  return upsertSettings({ settings: normalized, updatedByUserId: userId });
}

export async function getBackupConfigAndStatus() {
  const [configRows, lastBackup] = await Promise.all([
    getSettingsByKeys([
      "backup.schedule",
      "backup.retention_days",
      "backup.enabled",
    ]),
    getLastBackup(),
  ]);

  const config = {};
  for (const row of configRows) {
    config[row.key] = row.value;
  }

  return {
    config,
    lastBackup,
  };
}

export async function triggerManualBackup({ userId }) {
  // This only records a backup request. Actual DB backup should be handled by external tooling.
  const record = await createBackupRecord({
    type: "manual",
    status: "queued",
    triggeredByUserId: userId,
    details: { note: "Manual backup requested" },
  });
  return record;
}
