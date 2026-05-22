import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { NotificationItem } from "@/types";

export async function getNotifications() {
  const data = await apiGet<NotificationItem[] | { items: NotificationItem[] }>(
    "/api/notifications",
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await apiGet<{ count: number }>("/api/notifications/unread-count");
    return data?.count ?? 0;
  } catch {
    const list = await getNotifications();
    return list.filter((n) => !n.isRead).length;
  }
}

export async function markNotificationRead(notificationId: number) {
  try {
    await apiPut(`/api/notifications/${notificationId}/read`, {});
  } catch {
    await apiPost(`/api/notifications/${notificationId}/read`, {}).catch(() => {});
  }
}

export async function markAllNotificationsRead() {
  try {
    await apiPost("/api/notifications/read-all", {});
  } catch {
    await apiPut("/api/notifications/read-all", {}).catch(() => {});
  }
}
