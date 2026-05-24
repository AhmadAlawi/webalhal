const ACCESS_TOKEN_KEY = "rizaq_access_token";
const REFRESH_TOKEN_KEY = "rizaq_refresh_token";
const USER_KEY = "rizaq_user";
/** مطابق لموبايل: AsyncStorage auth_role_name */
const ROLE_NAME_KEY = "rizaq_role_name";

import type { AuthUser } from "@/types";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredRoleName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_NAME_KEY);
}

export function setStoredRoleName(roleName: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (roleName) localStorage.setItem(ROLE_NAME_KEY, roleName);
  else localStorage.removeItem(ROLE_NAME_KEY);
}

export function setAuthSession(
  accessToken: string,
  user: AuthUser,
  refreshToken?: string,
) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setStoredRoleName(user.roleName);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_NAME_KEY);
}
