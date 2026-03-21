import { apiRequest } from "./apiService";

// Use loose typing here and adapt to existing backend response shapes

export async function getRegistrationReport() {
  const [statsRes, regChartRes, deptChartRes] = await Promise.all([
    apiRequest<{ stats?: any }>("/dashboard/registrations"),
    apiRequest<{ data?: any[] }>("/dashboard/charts/registrations"),
    apiRequest<{ data?: any[] }>("/dashboard/charts/departments"),
  ]);

  const stats = statsRes?.stats ?? statsRes ?? null;

  return {
    stats,
    registrationsOverTime: Array.isArray(regChartRes?.data)
      ? regChartRes!.data
      : [],
    departments: Array.isArray(deptChartRes?.data) ? deptChartRes!.data : [],
  };
}

export async function getVerificationReport() {
  const [verifRes, dailyRes, hourlyRes] = await Promise.all([
    apiRequest<any>("/dashboard/verifications"),
    apiRequest<{ stats?: any[] }>("/logs/scans/statistics/daily"),
    apiRequest<{ stats?: any[] }>("/logs/scans/statistics/hourly"),
  ]);

  const stats = verifRes?.overall ? verifRes : (verifRes?.stats ?? null);

  return {
    stats,
    dailyStats: Array.isArray(dailyRes?.stats) ? dailyRes!.stats : [],
    hourlyStats: Array.isArray(hourlyRes?.stats) ? hourlyRes!.stats : [],
  };
}

export async function getAlertReport() {
  const [alertStatsRes, alertsListRes] = await Promise.all([
    apiRequest<{ stats?: any }>("/dashboard/alerts"),
    apiRequest<any>("/alerts?limit=100"),
  ]);

  const stats = alertStatsRes?.stats ?? alertStatsRes ?? null;
  const alertsArray =
    Array.isArray(alertsListRes?.alerts) || Array.isArray(alertsListRes?.data)
      ? (alertsListRes.alerts ?? alertsListRes.data)
      : [];

  return {
    stats,
    alerts: alertsArray,
  };
}

export async function getDepartmentReport() {
  const [deptChartRes, regStatsRes] = await Promise.all([
    apiRequest<{ data?: any[] }>("/dashboard/charts/departments"),
    apiRequest<{ stats?: any }>("/dashboard/registrations"),
  ]);

  const stats = regStatsRes?.stats ?? regStatsRes ?? null;

  return {
    stats,
    departments: Array.isArray(deptChartRes?.data) ? deptChartRes!.data : [],
  };
}
