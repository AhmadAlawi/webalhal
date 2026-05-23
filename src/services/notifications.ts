import { apiGet, apiPost } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import type { NotificationItem } from "@/types";

export async function getNotifications() {
  const data = await apiGet<NotificationItem[] | { items: NotificationItem[] }>(
    API.notifications.list,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await apiGet<{ count: number }>(API.notifications.unreadCount);
    return data?.count ?? 0;
  } catch {
    const list = await getNotifications();
    return list.filter((n) => !n.isRead).length;
  }
}

export async function markNotificationRead(notificationId: number) {
  await apiPost(API.notifications.read(notificationId), {}).catch(() => {});
}

export async function markAllNotificationsRead() {
  await apiPost(API.notifications.readAll, {});
}
