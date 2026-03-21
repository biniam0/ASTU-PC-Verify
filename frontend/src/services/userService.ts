import { apiRequest } from "./apiService";

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  role: "admin" | "security";
  fullName?: string | null;
  department?: string | null;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface ListUsersResponse {
  data: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    full_name?: string | null;
    department?: string | null;
    phone?: string | null;
    is_active?: boolean;
    created_at?: string;
    last_login_at?: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

function mapUser(row: ListUsersResponse["data"][number]): UserSummary {
  return {
    id: String(row.id),
    username: row.username,
    email: row.email,
    role: (row.role as "admin" | "security") ?? "security",
    fullName: row.full_name ?? null,
    department: row.department ?? null,
    phone: row.phone ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}

export async function listUsers(params?: {
  role?: "admin" | "security";
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: UserSummary[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (typeof params?.isActive === "boolean")
    query.set("isActive", String(params.isActive));
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await apiRequest<ListUsersResponse>(
    `/users${query.toString() ? `?${query.toString()}` : ""}`,
  );
  const users = Array.isArray(res.data) ? res.data.map(mapUser) : [];
  return { users, total: res.pagination?.total ?? users.length };
}

export async function createUser(payload: {
  username: string;
  email: string;
  role: "admin" | "security";
  fullName?: string;
  department?: string;
  phone?: string;
}): Promise<{ user: UserSummary; temporaryPassword: string }> {
  const res = await apiRequest<{
    user: ListUsersResponse["data"][number];
    temporaryPassword: string;
  }>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return { user: mapUser(res.user), temporaryPassword: res.temporaryPassword };
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
  deactivationReason?: string,
): Promise<UserSummary> {
  const res = await apiRequest<{ user: ListUsersResponse["data"][number] }>(
    `/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ isActive, deactivationReason }),
    },
  );
  return mapUser(res.user);
}

export async function resetUserPassword(
  userId: string,
): Promise<{ temporaryPassword: string }> {
  return apiRequest<{ temporaryPassword: string }>(
    `/users/${encodeURIComponent(userId)}/reset-password`,
    { method: "POST" },
  );
}
