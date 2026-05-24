"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import * as Permissions from "@/lib/permissions";
import { UserRole } from "@/types";

export { UserRole };

/**
 * صلاحيات التطبيق حسب دور الحساب (مزارع/تاجر/ناقل/حكومي).
 * المصدر: roleId من GET /api/profile/UserType/{userId} (عبر AuthContext).
 * ليس دور المحادثة في الشات (seller/buyer/transporter لتلك الصفقة).
 */
export function useUserPermissions() {
  const { user, isLoading, isAuthenticated, refreshProfile } = useAuth();
  const roleId = user?.roleId;
  const roleName = user?.roleName;

  return useMemo(
    () => ({
      userId: user?.userId,
      roleId,
      roleName,
      roleLabel: Permissions.roleLabel(roleId),
      isLoading,
      isAuthenticated,
      isFarmer: roleId === UserRole.Farmer,
      isTrader: roleId === UserRole.Trader,
      isTransport: roleId === UserRole.Transport,
      isGovernment: roleId === UserRole.Government,
      canCreateAuction: Permissions.canCreateAuction(roleId),
      canJoinAuction: Permissions.canJoinAuction(roleId),
      canCreateTender: Permissions.canCreateTender(roleId),
      canJoinTender: Permissions.canJoinTender(roleId),
      canCreateDirectListing: Permissions.canCreateDirectListing(roleId),
      showFab: Permissions.showFab(roleId),
      showTransportTab: Permissions.showTransportTab(roleId),
      refreshRole: refreshProfile,
    }),
    [user?.userId, roleId, roleName, isLoading, isAuthenticated, refreshProfile],
  );
}
