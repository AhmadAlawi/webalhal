"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { resolveNotificationDeepLink } from "@/lib/notificationDeepLinks";
import type { NotificationItem } from "@/types";

export default function NotificationsPage() {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!requireAuth()) return;
    getNotifications().then(setItems).catch(() => setItems([]));
  }, [requireAuth]);

  async function handleOpen(n: NotificationItem) {
    if (!n.isRead && n.notificationId) {
      try {
        await markNotificationRead(n.notificationId);
        setItems((prev) =>
          prev.map((x) =>
            x.notificationId === n.notificationId ? { ...x, isRead: true } : x,
          ),
        );
      } catch {
        /* ignore */
      }
    }
    const href = resolveNotificationDeepLink(n.clickAction);
    if (href) router.push(href);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader title="الإشعارات" backHref="/" />
      <PageContainer className="py-8">
        {unread > 0 && (
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" disabled={markingAll} onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4" />
              تعليم الكل كمقروء
            </Button>
          </div>
        )}
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {items.map((n) => (
            <li key={n.notificationId}>
              <button
                type="button"
                onClick={() => handleOpen(n)}
                className={`w-full px-6 py-4 text-start transition-colors hover:bg-slate-50 ${
                  !n.isRead ? "bg-emerald-50/40" : ""
                }`}
              >
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-500">{n.body}</p>
                {n.createdAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString("ar-SY")}
                  </p>
                )}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-16 text-center text-slate-500">لا توجد إشعارات</li>
          )}
        </ul>
      </PageContainer>
    </>
  );
}
