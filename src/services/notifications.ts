import { apiGet, apiPost } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
import { API } from "@/lib/api-endpoints";
import type { NotificationItem } from "@/types";

function normalizeNotification(raw: unknown): NotificationItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.notificationId ?? r.NotificationId ?? r.id ?? r.Id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    notificationId: id,
    title: String(r.title ?? r.Title ?? r.subject ?? r.Subject ?? ""),
    body: String(
      r.body ?? r.Body ?? r.message ?? r.Message ?? r.content ?? r.Content ?? "",
    ),
    isRead: Boolean(r.isRead ?? r.IsRead ?? r.read ?? r.Read ?? false),
    createdAt: (r.createdAt ?? r.CreatedAt) as string | undefined,
    clickAction: (r.clickAction ??
      r.ClickAction ??
      r.actionUrl ??
      r.ActionUrl ??
      r.deepLink) as string | undefined,
  };
}

function normalizeList(payload: unknown): NotificationItem[] {
  return asApiList(payload)
    .map(normalizeNotification)
    .filter((n): n is NotificationItem => n != null);
}

export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const data = await apiGet<unknown>(
      `${API.notifications.list}?page=1&pageSize=50`,
    );
    const list = normalizeList(data);
    if (list.length) return list;
    if (data && typeof data === "object") {
      const nested = (data as Record<string, unknown>).notifications;
      if (Array.isArray(nested)) {
        const fromNested = nested
          .map(normalizeNotification)
          .filter((n): n is NotificationItem => n != null);
        if (fromNested.length) return fromNested;
      }
    }
  } catch {
    /* fallback */
  }

  try {
    const unread = await apiGet<unknown>("/api/notifications/unread");
    const list = normalizeList(unread);
    if (list.length) return list;
    if (unread && typeof unread === "object") {
      const nested = (unread as Record<string, unknown>).notifications;
      if (Array.isArray(nested)) {
        return nested
          .map(normalizeNotification)
          .filter((n): n is NotificationItem => n != null);
      }
    }
  } catch {
    return [];
  }
  return [];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await apiGet<{ count?: number; Count?: number }>(
      API.notifications.unreadCount,
    );
    const n = data?.count ?? data?.Count;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  } catch {
    /* fallback */
  }
  const list = await getNotifications();
  return list.filter((n) => !n.isRead).length;
}

export async function markNotificationRead(notificationId: number) {
  await apiPost(API.notifications.read(notificationId), {}).catch(() => {});
}

export async function markAllNotificationsRead() {
  await apiPost(API.notifications.readAll, {});
}
