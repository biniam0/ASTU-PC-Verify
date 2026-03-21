import { apiRequest } from "./apiService";
import type {
  VerificationLogEntry,
  VerificationResult,
  VerificationStats,
  ScanHistoryEntry,
} from "@/types/verification";

/** Fetch verification stats. Backend: GET /api/dashboard/verifications */
export async function getVerificationStats(): Promise<VerificationStats> {
  const res = await apiRequest<{
    overall: {
      totalScans: number;
      registered: number;
      unregistered: number;
      noLaptops: number;
    };
    today: {
      totalScans: number;
      registered: number;
      unregistered: number;
      noLaptops: number;
    };
  }>("/dashboard/verifications");

  const overall = res?.overall;
  if (!overall) {
    return { totalScan: 0, verified: 0, alerts: 0 };
  }

  return {
    totalScan: overall.totalScans,
    verified: overall.registered,
    alerts: overall.unregistered + overall.noLaptops,
  };
}

/** Fetch verification log (recent scans). Backend: GET /api/logs/scans/today */
export async function getVerificationLogs(): Promise<VerificationLogEntry[]> {
  const res = await apiRequest<{ logs?: VerificationLogEntry[] }>(
    "/logs/scans/today",
  );
  const logs = res?.logs;
  return Array.isArray(logs) ? logs : [];
}

/** Fetch scan history by student database id (for laptop detail). Backend: GET /api/logs/scans/student-db/:studentDbId */
export async function getScanHistoryForStudentDb(
  studentDbId: string,
): Promise<ScanHistoryEntry[]> {
  const res = await apiRequest<{ logs?: any[] }>(
    `/logs/scans/student-db/${encodeURIComponent(studentDbId)}`,
  );
  const logs = Array.isArray(res?.logs) ? res.logs : [];

  return logs.map((row) => ({
    id: String(row.id),
    studentDbId: row.student_id != null ? String(row.student_id) : undefined,
    studentIdentifier: row.scanned_student_id ?? undefined,
    studentName: row.student_name ?? undefined,
    status: row.status ?? undefined,
    gateLocation: row.gate_location ?? undefined,
    scannedByUserId:
      row.scanned_by_user_id != null
        ? String(row.scanned_by_user_id)
        : undefined,
    createdAt: row.created_at,
  }));
}

interface BackendVerificationResultRegistered {
  status: "registered" | "no_laptops";
  student?: {
    studentId: string;
    fullName?: string;
    department?: string;
  };
  laptops?: {
    brand: string;
    model: string;
    serialNumber: string;
    images?: { url: string; isPrimary?: boolean }[];
  }[];
  message?: string;
}

interface BackendVerificationResultUnregistered {
  status: "unregistered";
  studentId: string;
  message?: string;
}

type BackendVerificationResult =
  | BackendVerificationResultRegistered
  | BackendVerificationResultUnregistered;

/** Scan/verify by student ID. Backend: POST /api/verification/scan */
export async function verifyByStudentId(
  studentId: string,
): Promise<VerificationResult> {
  const res = await apiRequest<BackendVerificationResult>(
    "/verification/scan",
    {
      method: "POST",
      body: JSON.stringify({ studentId: studentId.trim() }),
    },
  );

  if (res.status === "unregistered") {
    return {
      success: false,
      studentId: res.studentId,
      message: res.message ?? "Student ID not found",
    };
  }

  const student = res.student;
  const laptop =
    Array.isArray(res.laptops) && res.laptops.length > 0
      ? res.laptops[0]
      : undefined;

  if (res.status === "registered" && student && laptop) {
    const images = Array.isArray(laptop.images) ? laptop.images : [];
    const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

    return {
      success: true,
      studentId: student.studentId,
      studentName: student.fullName,
      department: student.department,
      laptop: {
        brandName: laptop.brand,
        model: laptop.model,
        serialNumber: laptop.serialNumber,
        imageUrl: primaryImage?.url,
      },
      message: res.message,
    };
  }

  // no_laptops or missing laptop data
  return {
    success: false,
    studentId: student?.studentId ?? studentId.trim(),
    studentName: student?.fullName,
    department: student?.department,
    message: res.message ?? "Student has no registered laptops",
  };
}
