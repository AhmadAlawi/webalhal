import { apiGet } from "@/lib/api";
import { unwrapEnvelopeData } from "@/lib/api-envelope";
import { getApiBaseUrl } from "@/lib/config";
import type { AuthUser, LoginResponse } from "@/types";
import { UserRole } from "@/types";

function mapRoleId(raw: unknown): UserRole {
  if (typeof raw === "number" && raw >= 1 && raw <= 4) return raw as UserRole;
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("farmer") || s === "1") return UserRole.Farmer;
  if (s.includes("transport") || s === "3") return UserRole.Transport;
  if (s.includes("gov") || s.includes("government") || s === "4") return UserRole.Government;
  if (s.includes("admin") || s.includes("super")) return UserRole.Government;
  return UserRole.Trader;
}

export async function login(
  emailOrPhone: string,
  password: string,
): Promise<LoginResponse & { user?: AuthUser }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone, password }),
  });

  const body = await res.json();

  if (res.status === 409) {
    const payload = unwrapEnvelopeData(body);
    const err = new Error("registration_incomplete") as Error & {
      registrationId?: string;
      currentStep?: number;
    };
    err.registrationId = String(
      payload.registrationId ?? (body as { registrationId?: string }).registrationId ?? "",
    );
    err.currentStep = Number(
      payload.currentStep ?? (body as { currentStep?: number }).currentStep ?? 0,
    );
    throw err;
  }

  if (!res.ok) {
    const payload = unwrapEnvelopeData(body);
    const outer = body as { message?: string; error?: { detail?: string } };
    throw new Error(
      (payload.message as string) ||
        outer.message ||
        outer.error?.detail ||
        "فشل تسجيل الدخول",
    );
  }

  const data = unwrapEnvelopeData<{
    userId?: number;
    roleId?: number | string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    user?: AuthUser;
  }>(body);

  const userId = data.userId ?? data.user?.userId;
  const roleId = mapRoleId(data.roleId ?? data.user?.roleId);

  if (!data.accessToken || userId == null) {
    throw new Error("استجابة غير صالحة من الخادم — لم يُعثر على رمز الدخول");
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId,
    expiresAt: data.expiresAt,
    user: {
      userId,
      roleId,
      fullName: data.fullName ?? data.user?.fullName,
      email: data.email ?? data.user?.email,
      phone: data.phone ?? data.user?.phone,
    },
  };
}

export async function getMyProfile(): Promise<AuthUser & Record<string, unknown>> {
  const { getMyProfile: getProfile } = await import("@/services/profile");
  return getProfile();
}

export async function refreshAccessToken(refreshToken: string) {
  const { getApiBaseUrl } = await import("@/lib/config");
  const { unwrapEnvelopeData } = await import("@/lib/api-envelope");

  const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error("انتهت الجلسة — سجّل الدخول مجدداً");
  }

  const data = unwrapEnvelopeData<{
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  }>(body);

  if (!data.accessToken) {
    throw new Error("فشل تجديد الجلسة");
  }

  return data;
}

export async function getCurrentUserType(
  userId?: number,
): Promise<{ roleId: number }> {
  const { API } = await import("@/lib/api-endpoints");
  if (userId != null) {
    return apiGet<{ roleId: number }>(API.profile.userType(userId));
  }
  const me = await apiGet<{ roleId?: number; userId?: number } & Record<string, unknown>>(
    API.auth.me,
  );
  return { roleId: Number(me?.roleId ?? 2) };
}
