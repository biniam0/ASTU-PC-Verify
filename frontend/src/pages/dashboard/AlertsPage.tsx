import { useEffect, useMemo, useState } from "react";
import {
  listAlerts,
  resolveAlert,
  markAlertFalseAlarm,
  type AlertItem,
  type AlertStatus,
  type AlertType,
} from "@/services/alertService";
import { apiRequest } from "@/services/apiService";

interface AlertSummaryStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  falseAlarms: number;
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

const STATUS_OPTIONS: { value: "" | AlertStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "false_alarm", label: "False alarms" },
];

const TYPE_OPTIONS: { value: "" | AlertType; label: string }[] = [
  { value: "", label: "All" },
  { value: "unregistered_id", label: "Unregistered ID" },
  { value: "no_laptop", label: "No laptop" },
  { value: "suspicious_activity", label: "Suspicious activity" },
];

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<AlertSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"" | AlertStatus>("active");
  const [type, setType] = useState<"" | AlertType>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [gateLocation, setGateLocation] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState(20);
  const [refreshToken, setRefreshToken] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, listRes] = await Promise.all([
          apiRequest<{ stats?: any }>("/dashboard/alerts"),
          listAlerts({
            status: status || undefined,
            type: type || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            gateLocation: gateLocation || undefined,
            page,
            limit,
          }),
        ]);

        if (cancelled) return;

        const stats = summaryRes?.stats ?? summaryRes ?? null;
        if (stats) {
          setSummary({
            totalAlerts: Number(stats.totalAlerts ?? 0),
            activeAlerts: Number(stats.activeAlerts ?? 0),
            resolvedAlerts: Number(stats.resolvedAlerts ?? 0),
            falseAlarms: Number(stats.falseAlarms ?? 0),
          });
        } else {
          setSummary(null);
        }

        setAlerts(listRes.alerts);
        setTotal(listRes.total);
        setLimit(listRes.limit ?? limit);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load alerts",
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
  }, [status, type, fromDate, toDate, gateLocation, page, limit, refreshToken]);

  const totalPages = useMemo(() => {
    if (!total || !limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setRefreshToken((x) => x + 1);
  }

  function handleClearFilters() {
    setStatus("");
    setType("");
    setFromDate("");
    setToDate("");
    setGateLocation("");
    setPage(1);
    setRefreshToken((x) => x + 1);
  }

  async function handleResolve(alert: AlertItem) {
    const notes = window.prompt(
      "Resolution notes (required):",
      alert.message || "Resolved after verification",
    );
    if (!notes) return;
    setActionLoadingId(alert.id);
    try {
      const updated = await resolveAlert(alert.id, notes);
      setAlerts((current) =>
        current.map((a) => (a.id === updated.id ? updated : a)),
      );
      setRefreshToken((x) => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve alert");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleFalseAlarm(alert: AlertItem) {
    const notes = window.prompt(
      "Optional note for marking false alarm:",
      alert.message || "Marked as false alarm",
    );
    setActionLoadingId(alert.id);
    try {
      const updated = await markAlertFalseAlarm(alert.id, notes || undefined);
      setAlerts((current) =>
        current.map((a) => (a.id === updated.id ? updated : a)),
      );
      setRefreshToken((x) => x + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark false alarm",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <BellIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Alerts</h2>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Filter alerts</h3>
          <form
            onSubmit={handleApplyFilters}
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                From date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                To date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Gate location
              </label>
              <input
                type="text"
                value={gateLocation}
                onChange={(e) => setGateLocation(e.target.value)}
                placeholder="e.g. Main Gate"
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="md:col-span-5 flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Clear
              </button>
              {summary && (
                <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span>
                    Total: <strong>{summary.totalAlerts}</strong>
                  </span>
                  <span>
                    Active: <strong>{summary.activeAlerts}</strong>
                  </span>
                  <span>
                    Resolved: <strong>{summary.resolvedAlerts}</strong>
                  </span>
                  <span>
                    False alarms: <strong>{summary.falseAlarms}</strong>
                  </span>
                </div>
              )}
            </div>
          </form>
        </section>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-gray-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Alerts list</h3>
            {loading && (
              <p className="text-xs text-gray-500">Loading alerts…</p>
            )}
          </div>
          <div className="overflow-x-auto">
            {alerts.length === 0 && !loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No alerts found for the selected filters.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Created at
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Student ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Gate
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Message
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-2 text-gray-900">
                        {new Date(alert.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-gray-900">{alert.type}</td>
                      <td className="px-4 py-2 text-gray-900">
                        {alert.status === "active" ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            Active
                          </span>
                        ) : alert.status === "resolved" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            False alarm
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {alert.studentId || "-"}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {alert.gateLocation || "-"}
                      </td>
                      <td className="px-4 py-2 text-gray-900 max-w-xs truncate">
                        {alert.message || "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          {alert.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleResolve(alert)}
                              disabled={actionLoadingId === alert.id}
                              className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Resolve
                            </button>
                          )}
                          {alert.status !== "false_alarm" && (
                            <button
                              type="button"
                              onClick={() => handleFalseAlarm(alert)}
                              disabled={actionLoadingId === alert.id}
                              className="rounded border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Mark false alarm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
              <div>
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
