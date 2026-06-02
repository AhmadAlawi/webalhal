import useSWR from "swr";
import { getUnreadCount } from "@/services/notifications";
import { getNotifiedCount } from "@/services/transport";
import { getChatUnreadCount } from "@/services/chat";
import { showTransportTab } from "@/lib/permissions";
import type { UserRole } from "@/types";

export function useHeaderBadges(
  isAuthenticated: boolean,
  roleId?: UserRole,
  userId?: number,
) {
  const notif = useSWR(
    isAuthenticated ? "header:notif-count" : null,
    getUnreadCount,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  const chat = useSWR(
    isAuthenticated && userId ? ["header:chat-count", userId] : null,
    () => getChatUnreadCount(userId),
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );

  const transport = useSWR(
    isAuthenticated && showTransportTab(roleId) ? "header:transport-count" : null,
    getNotifiedCount,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  return {
    notifCount: notif.data ?? 0,
    chatCount: chat.data ?? 0,
    transportCount: transport.data ?? 0,
    refresh: () => {
      void notif.mutate();
      void chat.mutate();
      void transport.mutate();
    },
  };
}
