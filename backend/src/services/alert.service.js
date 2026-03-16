import {
  createOrIncrementAlertForScan,
  getAlertById,
  listAlerts,
  listActiveAlerts,
  listAlertsForStudentIdentifier,
  updateAlertStatus,
  appendAlertNote,
  getAlertStatistics,
} from "../models/alert.model.js";
import {
  addAlertHistory,
  getAlertHistory,
} from "../models/alertHistory.model.js";

export async function createAlertForVerification({
  type,
  scannedStudentId,
  studentId,
  scanLogId,
  gateLocation,
  message,
  createdByUserId,
}) {
  const alert = await createOrIncrementAlertForScan({
    type,
    scannedStudentId,
    studentId,
    scanLogId,
    gateLocation,
    message,
    createdByUserId,
  });
  return alert;
}

export async function getAlertsWithFilters(filters) {
  return listAlerts(filters);
}

export async function getActiveAlerts() {
  return listActiveAlerts();
}

export async function getAlertDetails(alertId) {
  const alert = await getAlertById(alertId);
  if (!alert) {
    const error = new Error("Alert not found");
    error.status = 404;
    throw error;
  }
  const history = await getAlertHistory(alertId);
  return { alert, history };
}

export async function resolveAlert({ alertId, userId, notes, isFalseAlarm }) {
  const alert = await getAlertById(alertId);
  if (!alert) {
    const error = new Error("Alert not found");
    error.status = 404;
    throw error;
  }

  const newStatus = isFalseAlarm ? "false_alarm" : "resolved";

  const updated = await updateAlertStatus({
    alertId,
    newStatus,
    resolverUserId: userId,
    resolutionNotes: notes,
  });

  await addAlertHistory({
    alertId,
    oldStatus: alert.status,
    newStatus,
    changedByUserId: userId,
    notes,
  });

  return updated;
}

export async function addAlertNote({ alertId, userId, note }) {
  const alert = await getAlertById(alertId);
  if (!alert) {
    const error = new Error("Alert not found");
    error.status = 404;
    throw error;
  }

  const updated = await appendAlertNote({ alertId, note, userId });

  await addAlertHistory({
    alertId,
    oldStatus: alert.status,
    newStatus: alert.status,
    changedByUserId: userId,
    notes: note,
  });

  return updated;
}

export async function getAlertStats() {
  return getAlertStatistics();
}

export async function getAlertsForStudent({ studentId }) {
  const alerts = await listAlertsForStudentIdentifier(studentId);
  return alerts;
}
