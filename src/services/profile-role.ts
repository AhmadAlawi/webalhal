import { apiGet } from "@/lib/api";
import { UserRole } from "@/types";

/**
 * احتياط عندما UserType يعيد دور RBAC (مثل superadmin) بدون roleName تطبيقي.
 * المصدر الأساسي للدور: GET /api/profile/UserType/{userId} في services/auth.ts
 */
export async function detectAppRoleFromProfile(): Promise<UserRole | null> {
  const checks: { path: string; role: UserRole }[] = [
    { path: "/api/profile/farmer", role: UserRole.Farmer },
    { path: "/api/profile/trader", role: UserRole.Trader },
    { path: "/api/profile/transporter", role: UserRole.Transport },
    { path: "/api/profile/gov", role: UserRole.Government },
  ];

  for (const { path, role } of checks) {
    try {
      const data = await apiGet<Record<string, unknown>>(path);
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        return role;
      }
    } catch {
      /* 204 أو غير موجود */
    }
  }
  return null;
}
