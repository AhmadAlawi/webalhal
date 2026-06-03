"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  setAuthSession,
} from "@/lib/auth-storage";
import {
  isRegistrationIncomplete,
  parseRegistrationProgress,
  registerResumePath,
} from "@/lib/registration-progress";
import { login as loginApi, getMyProfile, resolveAuthUser, mapRoleId } from "@/services/auth";
import type { AuthUser } from "@/types";
import { UserRole } from "@/types";

interface LoginResult {
  registrationIncomplete?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  requireAuth: (redirectTo?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const maybeRedirectIncompleteRegistration = useCallback(
    (profile: Record<string, unknown>) => {
      const progress = parseRegistrationProgress(profile);
      if (!isRegistrationIncomplete(progress)) return false;
      if (pathname?.startsWith("/register") || pathname?.startsWith("/login")) {
        return true;
      }
      router.push(registerResumePath(progress));
      return true;
    },
    [pathname, router],
  );

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await getMyProfile();
      if (maybeRedirectIncompleteRegistration(profile as Record<string, unknown>)) {
        return;
      }
      const userId =
        (profile as AuthUser).userId ?? getStoredUser()?.userId ?? 0;
      const u = await resolveAuthUser(userId, {
        roleId: mapRoleId(
          (profile as AuthUser).roleId ?? getStoredUser()?.roleId,
        ),
        fullName: (profile as { fullName?: string }).fullName,
        email: (profile as { email?: string }).email,
        phone: (profile as { phone?: string }).phone,
      });
      setUser(u);
      setAuthSession(token, u);
    } catch {
      setUser(getStoredUser());
    }
  }, [maybeRedirectIncompleteRegistration]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && getAccessToken()) {
      setUser(stored);
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const login = useCallback(
    async (emailOrPhone: string, password: string): Promise<LoginResult> => {
      const result = await loginApi(emailOrPhone, password);
      let authUser = result.user;
      if (!authUser) {
        try {
          authUser = await resolveAuthUser(result.userId, { roleId: UserRole.Trader });
        } catch {
          authUser = { userId: result.userId, roleId: UserRole.Trader };
        }
      }
      setAuthSession(result.accessToken, authUser, result.refreshToken);
      setUser(authUser);

      if (result.registration && isRegistrationIncomplete(result.registration)) {
        router.push(registerResumePath(result.registration));
        return { registrationIncomplete: true };
      }

      await refreshProfile();
      return { registrationIncomplete: false };
    },
    [refreshProfile, router],
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (typeof window === "undefined") return !!getAccessToken();
      if (!getAccessToken()) {
        router.push(redirectTo);
        return false;
      }
      return true;
    },
    [router],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getAccessToken(),
      login,
      logout,
      refreshProfile,
      requireAuth,
    }),
    [user, isLoading, login, logout, refreshProfile, requireAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
