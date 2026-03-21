import { useEffect, useState } from "react";
import {
  getAlertReport,
  getDepartmentReport,
  getRegistrationReport,
  getVerificationReport,
} from "@/services/reportService";

type ReportTab = "registrations" | "verifications" | "alerts" | "departments";

interface RegistrationReportData {
  stats: any | null;
  registrationsOverTime: any[];
  departments: any[];
}

interface VerificationReportData {
  stats: any | null;
  dailyStats: any[];
  hourlyStats: any[];
}

interface AlertReportData {
  stats: any | null;
  alerts: any[];
}

interface DepartmentReportData {
  stats: any | null;
  departments: any[];
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("registrations");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationData, setRegistrationData] =
    useState<RegistrationReportData | null>(null);
  const [verificationData, setVerificationData] =
    useState<VerificationReportData | null>(null);
  const [alertData, setAlertData] = useState<AlertReportData | null>(null);
  const [departmentData, setDepartmentData] =
    useState<DepartmentReportData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (tab === "registrations") {
          const data = await getRegistrationReport();
          if (!cancelled) setRegistrationData(data);
        } else if (tab === "verifications") {
          const data = await getVerificationReport();
          if (!cancelled) setVerificationData(data);
        } else if (tab === "alerts") {
          const data = await getAlertReport();
          if (!cancelled) setAlertData(data);
        } else if (tab === "departments") {
          const data = await getDepartmentReport();
          if (!cancelled) setDepartmentData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load report data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Uses only existing backend endpoints to summarize registrations,
            verifications, alerts, and departments.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["registrations", "Registration reports"],
            ["verifications", "Verification reports"],
            ["alerts", "Alert reports"],
            ["departments", "Department reports"],
          ] as [ReportTab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition $${
              tab === value
                ? " bg-teal-600 text-white"
                : " bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading report data…</p>}

      {!loading && !error && tab === "registrations" && registrationData && (
        <RegistrationReportView data={registrationData} />
      )}

      {!loading && !error && tab === "verifications" && verificationData && (
        <VerificationReportView data={verificationData} />
      )}

      {!loading && !error && tab === "alerts" && alertData && (
        <AlertReportView data={alertData} />
      )}

      {!loading && !error && tab === "departments" && departmentData && (
        <DepartmentReportView data={departmentData} />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string | null | undefined;
  tone?: "default" | "success" | "danger";
}) {
  const colorClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-red-600"
        : "text-gray-900";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className={`text-xl font-bold ${colorClass}`}>{value ?? "-"}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function RegistrationReportView({ data }: { data: RegistrationReportData }) {
  const s = data.stats ?? {};
  const totalStudents = Number(s.totalStudents ?? 0);
  const totalLaptops = Number(s.totalLaptops ?? 0);
  const studentsWithoutLaptops = Number(s.studentsWithoutLaptops ?? 0);
  const todayStudentRegistrations = Number(s.todayStudentRegistrations ?? 0);
  const todayLaptopRegistrations = Number(s.todayLaptopRegistrations ?? 0);
  const averageLaptopsPerStudent =
    totalStudents > 0 ? (totalLaptops / totalStudents).toFixed(2) : "0";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total registered students" value={totalStudents} />
        <SummaryCard label="Total registered laptops" value={totalLaptops} />
        <SummaryCard
          label="Students without any laptop"
          value={studentsWithoutLaptops}
        />
        <SummaryCard
          label="Avg laptops per student"
          value={averageLaptopsPerStudent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label="New students registered today"
          value={todayStudentRegistrations}
        />
        <SummaryCard
          label="New laptops registered today"
          value={todayLaptopRegistrations}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Registrations over last 30 days
          </h2>
          {data.registrationsOverTime.length === 0 ? (
            <p className="text-sm text-gray-500">No data available.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-gray-700">
              {data.registrationsOverTime.map((row, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{String(row.date).slice(0, 10)}</span>
                  <span>
                    {row.studentsRegistered ?? 0} students ·{" "}
                    {row.laptopsRegistered ?? 0} laptops
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Department distribution
          </h2>
          {data.departments.length === 0 ? (
            <p className="text-sm text-gray-500">No department data.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Department
                  </th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">
                    Students
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.departments.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 text-gray-900">
                      {row.department ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-right text-gray-900">
                      {row.count ?? row.total ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function VerificationReportView({ data }: { data: VerificationReportData }) {
  const overall = data.stats?.overall ?? data.stats ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total scans" value={overall.totalScans} />
        <SummaryCard
          label="Registered"
          value={overall.registered}
          tone="success"
        />
        <SummaryCard
          label="Unregistered / no laptop"
          value={(overall.unregistered ?? 0) + (overall.noLaptops ?? 0)}
          tone="danger"
        />
        {/* Average response time could be derived later from scan_logs */}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Daily scan summary
          </h2>
          {data.dailyStats.length === 0 ? (
            <p className="text-sm text-gray-500">No daily statistics.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Date
                  </th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.dailyStats.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 text-gray-900">
                      {String(row.date).slice(0, 10)}
                    </td>
                    <td className="px-2 py-1 text-right text-gray-900">
                      {row.total_scans ?? row.totalScans ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Hourly distribution
          </h2>
          {data.hourlyStats.length === 0 ? (
            <p className="text-sm text-gray-500">No hourly statistics.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Hour
                  </th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">
                    Scans
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.hourlyStats.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 text-gray-900">
                      {row.hour ?? row.hour_label ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-right text-gray-900">
                      {row.total_scans ?? row.totalScans ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function AlertReportView({ data }: { data: AlertReportData }) {
  const s = data.stats ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total alerts" value={s.totalAlerts} />
        <SummaryCard label="Active" value={s.activeAlerts} tone="danger" />
        <SummaryCard label="Resolved" value={s.resolvedAlerts} tone="success" />
        <SummaryCard
          label="False alarms"
          value={s.falseAlarms}
          tone="default"
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Recent alerts
        </h2>
        {data.alerts.length === 0 ? (
          <p className="text-sm text-gray-500">No alerts found.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto text-xs">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Type
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Gate
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">
                    Created at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.alerts.map((row, idx) => (
                  <tr key={row.id ?? idx}>
                    <td className="px-2 py-1 text-gray-900">
                      {row.type ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-gray-900">
                      {row.status ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-gray-900">
                      {row.gate_location ?? row.gateLocation ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-gray-900">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : row.createdAt
                          ? new Date(row.createdAt).toLocaleString()
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DepartmentReportView({ data }: { data: DepartmentReportData }) {
  const s = data.stats ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total students" value={s.totalStudents} />
        <SummaryCard label="Total laptops" value={s.totalLaptops} />
        <SummaryCard
          label="Students without laptops"
          value={s.studentsWithoutLaptops}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Students by department
        </h2>
        {data.departments.length === 0 ? (
          <p className="text-sm text-gray-500">No data available.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-600">
                  Department
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-600">
                  Students
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.departments.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 text-gray-900">
                    {row.department ?? "-"}
                  </td>
                  <td className="px-2 py-1 text-right text-gray-900">
                    {row.count ?? row.total ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
