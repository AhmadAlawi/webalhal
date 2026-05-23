"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  setAuthSession,
} from "@/lib/auth-storage";
import { login as loginApi, getMyProfile, resolveAuthUser, mapRoleId } from "@/services/auth";
import type { AuthUser } from "@/types";
import { UserRole } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  requireAuth: (redirectTo?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await getMyProfile();
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
  }, []);

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
    async (emailOrPhone: string, password: string) => {
      const result = await loginApi(emailOrPhone, password);
      const authUser =
        result.user ??
        (await resolveAuthUser(result.userId, { roleId: UserRole.Trader }));
      setAuthSession(result.accessToken, authUser, result.refreshToken);
      setUser(authUser);
      await refreshProfile();
    },
    [refreshProfile],
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
