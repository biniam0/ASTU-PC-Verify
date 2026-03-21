import { apiRequest } from "./apiService";

export interface LoginCredentials {
  /** Backend expects email + password for login */
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

function persistAuth(response: AuthResponse | null | undefined) {
  if (typeof window === "undefined" || !response?.token) return;
  try {
    window.localStorage.setItem("authToken", response.token);
    window.localStorage.setItem("authUser", JSON.stringify(response.user));
  } catch {
    // ignore storage errors
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("authUser");
  } catch {
    // ignore
  }
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  fullName?: string;
}

/** Login with email + password. Backend: POST /api/auth/login */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
  persistAuth(result);
  return result;
}

/** Fetch current user profile. Backend: GET /api/auth/profile */
export async function fetchProfile(): Promise<AuthUser> {
  const res = await apiRequest<{ user: AuthUser }>("/auth/profile");
  if (res?.user) {
    persistAuth({
      token: window.localStorage.getItem("authToken") ?? "",
      user: res.user,
    });
    return res.user;
  }
  throw new Error("Failed to load profile");
}

/** Logout from API and clear local session. Backend: POST /api/auth/logout */
export async function logout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
  } catch {
    // ignore API errors on logout
  } finally {
    clearStoredAuth();
  }
}

/** Change current user's password. Backend: PUT /api/auth/change-password */
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    }),
  });
  return res;
}

/** Update own profile (admin only, via /api/users/:id). */
export async function updateOwnProfile(
  userId: string,
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const res = await apiRequest<{ user: AuthUser }>(
    `/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  if (!res?.user) {
    throw new Error("Failed to update profile");
  }
  persistAuth({
    token: window.localStorage.getItem("authToken") ?? "",
    user: res.user,
  });
  return res.user;
}

/** Request password reset – note: no public endpoint exists yet on backend. */
export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  throw new Error(
    "Password reset via email is not implemented on the backend yet.",
  );
}
