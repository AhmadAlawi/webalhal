import useSWR from "swr";
import { getUnreadCount } from "@/services/notifications";
import { getNotifiedCount } from "@/services/transport";
import { showTransportTab } from "@/lib/permissions";
import type { UserRole } from "@/types";

export function useHeaderBadges(
  isAuthenticated: boolean,
  roleId?: UserRole,
) {
  const notif = useSWR(
    isAuthenticated ? "header:notif-count" : null,
    getUnreadCount,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  const transport = useSWR(
    isAuthenticated && showTransportTab(roleId) ? "header:transport-count" : null,
    getNotifiedCount,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  return {
    notifCount: notif.data ?? 0,
    transportCount: transport.data ?? 0,
    refresh: () => {
      void notif.mutate();
      void transport.mutate();
    },
  };
}
