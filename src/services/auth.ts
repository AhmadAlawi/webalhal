import { apiGet } from "@/lib/api";
import { unwrapEnvelopeData } from "@/lib/api-envelope";
import { getStoredUser, setStoredRoleName } from "@/lib/auth-storage";
import { getApiBaseUrl } from "@/lib/config";
import { API } from "@/lib/api-endpoints";
import type { AuthUser, LoginResponse, ProfileUserType } from "@/types";
import { UserRole } from "@/types";

export function mapRoleId(raw: unknown): UserRole {
  if (typeof raw === "number") {
    if (raw === UserRole.Farmer) return UserRole.Farmer;
    if (raw === UserRole.Trader) return UserRole.Trader;
    if (raw === UserRole.Transport) return UserRole.Transport;
    if (raw === UserRole.Government) return UserRole.Government;
    if (raw === 1) return UserRole.Farmer;
    if (raw === 2) return UserRole.Trader;
    if (raw === 3) return UserRole.Transport;
    if (raw === 4) return UserRole.Government;
  }
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("farmer") || s === "1" || s === "mزارع") return UserRole.Farmer;
  if (s.includes("transport") || s === "3" || s === "transporter" || s === "ناقل") {
    return UserRole.Transport;
  }
  if (
    s.includes("gov") ||
    s.includes("government") ||
    s === "4" ||
    s === "gov_employee" ||
    s === "agri_service"
  ) {
    return UserRole.Government;
  }
  if (s.includes("trader") || s === "2" || s === "تاجر") return UserRole.Trader;
  return UserRole.Trader;
}

/** تحويل roleName من التسجيل/UserType إلى دور التطبيق 1–4 */
export function mapRoleNameToAppRole(roleName?: string | null): UserRole | null {
  if (!roleName?.trim()) return null;
  const s = roleName.trim().toLowerCase();
  if (s === "farmer" || s.includes("farmer")) return UserRole.Farmer;
  if (s === "trader" || s.includes("trader")) return UserRole.Trader;
  if (s === "transporter" || s.includes("transport")) return UserRole.Transport;
  if (
    s === "gov_employee" ||
    s === "government" ||
    s === "agri_service" ||
    s.includes("gov")
  ) {
    return UserRole.Government;
  }
  return null;
}

function parseUserTypePayload(raw: unknown): ProfileUserType {
  if (!raw || typeof raw !== "object") return {};
  return raw as ProfileUserType;
}

/**
 * يستخرج دور التطبيق (1–4) من UserType.
 * إذا roleId من الـ API RBAC (مثل 10 superadmin) يُستخدم roleName.
 */
export function appRoleFromUserType(data: ProfileUserType): {
  roleId: UserRole | null;
  roleName?: string;
} {
  const roleName = data.roleName?.trim() || undefined;
  const apiRoleId = Number(data.roleId);

  const fromName = mapRoleNameToAppRole(roleName);
  if (fromName != null) {
    return { roleId: fromName, roleName };
  }

  if (Number.isFinite(apiRoleId) && apiRoleId >= 1 && apiRoleId <= 4) {
    return { roleId: mapRoleId(apiRoleId), roleName };
  }

  /** RBAC (مثل superadmin roleId=10) — يُكمَل من profile/farmer|trader|… */
  return { roleId: null, roleName };
}

/**
 * GET /api/profile/UserType/{userId}
 * userId: المعامل، ثم المستخدم المحفوظ، ثم GET /api/profile/me
 */
export async function getCurrentUserType(userId?: number): Promise<{
  roleId: UserRole | null;
  roleName?: string;
  userId: number;
  raw?: ProfileUserType;
}> {
  let uid = userId;

  if (uid == null) {
    uid = getStoredUser()?.userId;
  }

  if (uid == null) {
    try {
      const me = await apiGet<Record<string, unknown>>(API.profile.me);
      const fromMe = Number(me.userId ?? me.UserId);
      if (Number.isFinite(fromMe) && fromMe > 0) uid = fromMe;
    } catch {
      /* ignore */
    }
  }

  if (uid == null) {
    return { roleId: null, userId: 0 };
  }

  const raw = await apiGet<ProfileUserType>(API.profile.userType(uid));
  const payload = parseUserTypePayload(raw);
  const { roleId, roleName } = appRoleFromUserType(payload);

  if (roleName) setStoredRoleName(roleName);

  return { roleId, roleName, userId: uid, raw: payload };
}

/** بعد تسجيل الدخول: UserType أولاً، ثم ملف profile كاحتياط */
export async function resolveAuthUser(
  userId: number,
  partial?: Partial<AuthUser>,
): Promise<AuthUser> {
  let roleId: UserRole | undefined;
  let roleName: string | undefined;

  try {
    const type = await getCurrentUserType(userId);
    roleName = type.roleName ?? roleName;
    if (type.roleId != null) roleId = type.roleId;
  } catch {
    /* ignore */
  }

  if (roleId == null) {
    const fromPartial = mapRoleNameToAppRole(partial?.roleName);
    if (fromPartial != null) {
      roleId = fromPartial;
      roleName = partial?.roleName ?? roleName;
    } else if (partial?.roleId != null && partial.roleId >= 1 && partial.roleId <= 4) {
      roleId = mapRoleId(partial.roleId);
    }
  }

  if (roleId == null) {
    const { detectAppRoleFromProfile } = await import("@/services/profile-role");
    const profileRole = await detectAppRoleFromProfile();
    if (profileRole != null) {
      roleId = profileRole;
    }
  }

  if (roleName) setStoredRoleName(roleName);

  return {
    userId,
    roleId: roleId ?? mapRoleId(partial?.roleId) ?? UserRole.Trader,
    roleName,
    fullName: partial?.fullName,
    email: partial?.email,
    phone: partial?.phone,
  };
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
  if (!data.accessToken || userId == null) {
    throw new Error("استجابة غير صالحة من الخادم — لم يُعثر على رمز الدخول");
  }

  const user = await resolveAuthUser(userId, {
    roleId: mapRoleId(data.roleId ?? data.user?.roleId),
    roleName: data.user?.roleName,
    fullName: data.fullName ?? data.user?.fullName,
    email: data.email ?? data.user?.email,
    phone: data.phone ?? data.user?.phone,
  });

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId,
    expiresAt: data.expiresAt,
    user,
  };
}

export async function getMyProfile(): Promise<AuthUser & Record<string, unknown>> {
  const { getMyProfile: getProfile } = await import("@/services/profile");
  return getProfile();
}

export async function refreshAccessToken(refreshToken: string) {
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
