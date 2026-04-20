import { useEffect, useMemo, useState } from "react";
import {
  listUsers,
  createUser,
  updateUserStatus,
  resetUserPassword,
} from "@/services/userService";
import type { UserSummary } from "@/services/userService";

function PeopleIcon({ className }: { className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function PlusPersonIcon({ className }: { className?: string }) {
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
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function ManageUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    department: "",
    phone: "",
    role: "security" as "admin" | "security",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listUsers({ role: "security" })
      .then(({ users }) => {
        if (!cancelled) setUsers(users);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.department ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setError("Username and email are required.");
      return;
    }
    setCreating(true);
    setError(null);
    setTempPasswordInfo(null);
    try {
      const { user, temporaryPassword } = await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        fullName: form.fullName.trim() || undefined,
        department: form.department.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      setUsers((prev) => [user, ...prev]);
      setForm({
        username: "",
        email: "",
        fullName: "",
        department: "",
        phone: "",
        role: "security",
      });
      setTempPasswordInfo(
        `Temporary password for ${user.username}: ${temporaryPassword}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create user account",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: UserSummary) {
    const nextActive = !user.isActive;
    if (!nextActive) {
      const ok = window.confirm(
        `Deactivate user "${user.username}"? They will not be able to log in.`,
      );
      if (!ok) return;
    }
    const reason = !nextActive
      ? window.prompt(
          "Reason for deactivation (required):",
          "Left organization",
        ) || "Left organization"
      : undefined;
    setStatusUpdatingId(user.id);
    try {
      const updated = await updateUserStatus(user.id, nextActive, reason);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleResetPassword(user: UserSummary) {
    const ok = window.confirm(
      `Reset password for "${user.username}" and generate a new temporary password?`,
    );
    if (!ok) return;
    try {
      const res = await resetUserPassword(user.id);
      setTempPasswordInfo(
        `New temporary password for ${user.username}: ${res.temporaryPassword}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset user password",
      );
    }
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <PeopleIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Manage Securities</h2>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            Create admin or security account
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            New accounts are created with a strong temporary password. Share the
            temporary password securely with the staff member.
          </p>
          <form
            onSubmit={handleCreate}
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full name (optional)
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department / Unit (optional)
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as "admin" | "security",
                  }))
                }
                className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="security">Security staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                <PlusPersonIcon className="h-5 w-5" />
                {creating ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
          {tempPasswordInfo && (
            <p className="mt-3 rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
              {tempPasswordInfo}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Existing users
            </h3>
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name, email, department"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading users…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No users found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Username
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Department
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Last login
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-2 text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-2 text-gray-900">{user.email}</td>
                      <td className="px-4 py-2 text-gray-900">{user.role}</td>
                      <td className="px-4 py-2 text-gray-900">
                        {user.department || "-"}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {user.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            disabled={statusUpdatingId === user.id}
                            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-100"
                          >
                            Reset password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
