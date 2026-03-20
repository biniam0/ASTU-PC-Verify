import { query } from "../config/db.js";
import {
  getCachedMetric,
  setCachedMetric,
} from "../models/dashboardCache.model.js";

const DEFAULT_CACHE_TTL_SECONDS = Number(
  process.env.DASHBOARD_CACHE_TTL_SECONDS || 300,
);

async function withCache(key, compute, ttlSeconds = DEFAULT_CACHE_TTL_SECONDS) {
  if (ttlSeconds > 0) {
    const cached = await getCachedMetric({ key });
    if (cached) {
      return cached;
    }
  }

  const payload = await compute();

  if (ttlSeconds > 0) {
    await setCachedMetric({ key, payload, ttlSeconds });
  }

  return payload;
}

export async function getDashboardSummary() {
  return withCache("dashboard_summary", async () => {
    const result = await query(
      `SELECT
         (SELECT COUNT(*) FROM students WHERE is_active = TRUE) AS total_students,
         (SELECT COUNT(*) FROM laptops) AS total_laptops,
         (SELECT COUNT(*) FROM students s
            LEFT JOIN laptops l ON l.student_id = s.id
          WHERE s.is_active = TRUE AND l.id IS NULL) AS students_without_laptops,
         (SELECT COUNT(*) FROM scan_logs WHERE created_at::date = CURRENT_DATE) AS today_scans,
         (SELECT COUNT(*) FROM alerts WHERE status = 'active') AS active_alerts,
         (SELECT COUNT(*) FROM students WHERE created_at::date = CURRENT_DATE) AS today_student_registrations,
         (SELECT COUNT(*) FROM laptops WHERE created_at::date = CURRENT_DATE) AS today_laptop_registrations
       `,
    );

    const breakdownResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'registered') AS registered,
         COUNT(*) FILTER (WHERE status = 'unregistered') AS unregistered,
         COUNT(*) FILTER (WHERE status = 'no_laptops') AS no_laptops
       FROM scan_logs
       WHERE created_at::date = CURRENT_DATE`,
    );

    const row = result.rows[0];
    const breakdown = breakdownResult.rows[0] || {};

    return {
      totalStudents: Number(row.total_students || 0),
      totalLaptops: Number(row.total_laptops || 0),
      studentsWithoutLaptops: Number(row.students_without_laptops || 0),
      todayScans: Number(row.today_scans || 0),
      activeAlerts: Number(row.active_alerts || 0),
      todayStudentRegistrations: Number(row.today_student_registrations || 0),
      todayLaptopRegistrations: Number(row.today_laptop_registrations || 0),
      scansByResult: {
        registered: Number(breakdown.registered || 0),
        unregistered: Number(breakdown.unregistered || 0),
        noLaptops: Number(breakdown.no_laptops || 0),
      },
    };
  });
}

export async function getAdminDashboard() {
  return withCache("dashboard_admin", async () => {
    const summary = await getDashboardSummary();

    const [alertsAgg, deptDist] = await Promise.all([
      query(
        `SELECT
           type,
           COUNT(*) FILTER (WHERE status = 'active') AS active_count,
           COUNT(*) AS total_count
         FROM alerts
         GROUP BY type
         ORDER BY type`,
      ),
      query(
        `SELECT department, COUNT(*) AS total
         FROM students
         WHERE is_active = TRUE
         GROUP BY department
         ORDER BY department`,
      ),
    ]);

    return {
      summary,
      alertsByType: alertsAgg.rows.map((r) => ({
        type: r.type,
        active: Number(r.active_count || 0),
        total: Number(r.total_count || 0),
      })),
      departmentDistribution: deptDist.rows.map((r) => ({
        department: r.department,
        count: Number(r.total || 0),
      })),
    };
  });
}

export async function getSecurityDashboard({ userId, gateLocation }) {
  const todayScansResult = await query(
    `SELECT
       COUNT(*) AS today_scans,
       COUNT(*) FILTER (WHERE scanned_by_user_id = $1) AS today_scans_by_user
     FROM scan_logs
     WHERE created_at::date = CURRENT_DATE`,
    [userId],
  );
  const today = todayScansResult.rows[0] || {};

  const activeAlertsResult = await query(
    `SELECT id, type, severity, status, gate_location, created_at
     FROM alerts
     WHERE status = 'active'
     ORDER BY created_at DESC
     LIMIT 20`,
  );

  let recentScansAtGate = [];
  let gateDistribution = [];

  if (gateLocation) {
    const scansRes = await query(
      `SELECT id, scanned_student_id, status, gate_location, created_at
       FROM scan_logs
       WHERE created_at::date = CURRENT_DATE
         AND gate_location = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [gateLocation],
    );
    recentScansAtGate = scansRes.rows;
  }

  const gateDistRes = await query(
    `SELECT gate_location, COUNT(*) AS total
     FROM scan_logs
     WHERE created_at::date = CURRENT_DATE
     GROUP BY gate_location
     ORDER BY total DESC`,
  );
  gateDistribution = gateDistRes.rows.map((r) => ({
    gateLocation: r.gate_location,
    count: Number(r.total || 0),
  }));

  return {
    todayScans: Number(today.today_scans || 0),
    todayScansByUser: Number(today.today_scans_by_user || 0),
    activeAlerts: activeAlertsResult.rows,
    recentScansAtGate,
    gateDistribution,
  };
}

export async function getRegistrationStats() {
  return withCache("dashboard_registrations", async () => {
    const result = await query(
      `SELECT
         (SELECT COUNT(*) FROM students WHERE is_active = TRUE) AS total_students,
         (SELECT COUNT(*) FROM laptops) AS total_laptops,
         (SELECT COUNT(*) FROM students s
            LEFT JOIN laptops l ON l.student_id = s.id
          WHERE s.is_active = TRUE AND l.id IS NULL) AS students_without_laptops,
         (SELECT COUNT(*) FROM students WHERE created_at::date = CURRENT_DATE) AS today_student_registrations,
         (SELECT COUNT(*) FROM laptops WHERE created_at::date = CURRENT_DATE) AS today_laptop_registrations
       `,
    );

    const row = result.rows[0];

    return {
      totalStudents: Number(row.total_students || 0),
      totalLaptops: Number(row.total_laptops || 0),
      studentsWithoutLaptops: Number(row.students_without_laptops || 0),
      todayStudentRegistrations: Number(row.today_student_registrations || 0),
      todayLaptopRegistrations: Number(row.today_laptop_registrations || 0),
    };
  });
}

export async function getVerificationStats() {
  return withCache("dashboard_verifications", async () => {
    const totalRes = await query(
      `SELECT
         COUNT(*) AS total_scans,
         COUNT(*) FILTER (WHERE status = 'registered') AS registered,
         COUNT(*) FILTER (WHERE status = 'unregistered') AS unregistered,
         COUNT(*) FILTER (WHERE status = 'no_laptops') AS no_laptops
       FROM scan_logs`,
    );

    const todayRes = await query(
      `SELECT
         COUNT(*) AS total_scans,
         COUNT(*) FILTER (WHERE status = 'registered') AS registered,
         COUNT(*) FILTER (WHERE status = 'unregistered') AS unregistered,
         COUNT(*) FILTER (WHERE status = 'no_laptops') AS no_laptops
       FROM scan_logs
       WHERE created_at::date = CURRENT_DATE`,
    );

    const total = totalRes.rows[0] || {};
    const today = todayRes.rows[0] || {};

    return {
      overall: {
        totalScans: Number(total.total_scans || 0),
        registered: Number(total.registered || 0),
        unregistered: Number(total.unregistered || 0),
        noLaptops: Number(total.no_laptops || 0),
      },
      today: {
        totalScans: Number(today.total_scans || 0),
        registered: Number(today.registered || 0),
        unregistered: Number(today.unregistered || 0),
        noLaptops: Number(today.no_laptops || 0),
      },
    };
  });
}

export async function getAlertStats() {
  return withCache("dashboard_alerts", async () => {
    const summaryRes = await query(
      `SELECT
         COUNT(*) AS total_alerts,
         COUNT(*) FILTER (WHERE status = 'active') AS active_alerts,
         COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_alerts,
         COUNT(*) FILTER (WHERE status = 'false_alarm') AS false_alarms
       FROM alerts`,
    );

    const byTypeRes = await query(
      `SELECT type, COUNT(*) FILTER (WHERE status = 'active') AS active_count
       FROM alerts
       GROUP BY type
       ORDER BY type`,
    );

    const bySeverityRes = await query(
      `SELECT severity, COUNT(*) FILTER (WHERE status = 'active') AS active_count
       FROM alerts
       GROUP BY severity
       ORDER BY severity`,
    );

    const s = summaryRes.rows[0] || {};

    return {
      totalAlerts: Number(s.total_alerts || 0),
      activeAlerts: Number(s.active_alerts || 0),
      resolvedAlerts: Number(s.resolved_alerts || 0),
      falseAlarms: Number(s.false_alarms || 0),
      activeByType: byTypeRes.rows.map((r) => ({
        type: r.type,
        active: Number(r.active_count || 0),
      })),
      activeBySeverity: bySeverityRes.rows.map((r) => ({
        severity: r.severity,
        active: Number(r.active_count || 0),
      })),
    };
  });
}

export async function getRecentActivity() {
  const [scanRes, alertRes] = await Promise.all([
    query(
      `SELECT id, 'scan' AS kind, scanned_student_id, status,
              gate_location, scanned_by_user_id, created_at
       FROM scan_logs
       ORDER BY created_at DESC
       LIMIT 50`,
    ),
    query(
      `SELECT id, 'alert' AS kind, scanned_student_id, type, severity,
              status, gate_location, created_at
       FROM alerts
       ORDER BY created_at DESC
       LIMIT 50`,
    ),
  ]);

  const merged = [...scanRes.rows, ...alertRes.rows];
  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return merged.slice(0, 50);
}

export async function getRegistrationChartData() {
  return withCache("dashboard_chart_registrations", async () => {
    const res = await query(
      `WITH days AS (
         SELECT generate_series(
           CURRENT_DATE - INTERVAL '29 days',
           CURRENT_DATE,
           INTERVAL '1 day'
         )::date AS day
       )
       SELECT
         d.day AS date,
         COALESCE(s.count_students, 0) AS students_registered,
         COALESCE(l.count_laptops, 0) AS laptops_registered
       FROM days d
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS count_students
         FROM students
         GROUP BY created_at::date
       ) s ON s.day = d.day
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS count_laptops
         FROM laptops
         GROUP BY created_at::date
       ) l ON l.day = d.day
       ORDER BY d.day ASC`,
    );

    return res.rows.map((r) => ({
      date: r.date,
      studentsRegistered: Number(r.students_registered || 0),
      laptopsRegistered: Number(r.laptops_registered || 0),
    }));
  });
}

export async function getScanChartData() {
  return withCache("dashboard_chart_scans", async () => {
    const res = await query(
      `WITH days AS (
         SELECT generate_series(
           CURRENT_DATE - INTERVAL '29 days',
           CURRENT_DATE,
           INTERVAL '1 day'
         )::date AS day
       )
       SELECT
         d.day AS date,
         COALESCE(s.total_scans, 0) AS total_scans,
         COALESCE(s.registered, 0) AS registered,
         COALESCE(s.unregistered, 0) AS unregistered,
         COALESCE(s.no_laptops, 0) AS no_laptops
       FROM days d
       LEFT JOIN (
         SELECT
           created_at::date AS day,
           COUNT(*) AS total_scans,
           COUNT(*) FILTER (WHERE status = 'registered') AS registered,
           COUNT(*) FILTER (WHERE status = 'unregistered') AS unregistered,
           COUNT(*) FILTER (WHERE status = 'no_laptops') AS no_laptops
         FROM scan_logs
         GROUP BY created_at::date
       ) s ON s.day = d.day
       ORDER BY d.day ASC`,
    );

    return res.rows.map((r) => ({
      date: r.date,
      totalScans: Number(r.total_scans || 0),
      registered: Number(r.registered || 0),
      unregistered: Number(r.unregistered || 0),
      noLaptops: Number(r.no_laptops || 0),
    }));
  });
}

export async function getDepartmentDistributionChartData() {
  return withCache("dashboard_chart_departments", async () => {
    const res = await query(
      `SELECT department, COUNT(*) AS total
       FROM students
       WHERE is_active = TRUE
       GROUP BY department
       ORDER BY department`,
    );

    return res.rows.map((r) => ({
      department: r.department,
      count: Number(r.total || 0),
    }));
  });
}
