"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateAr } from "@/lib/format";
import {
  getDirectOrder,
  updateDirectOrderStatus,
  cancelDirectOrder,
  type DirectOrder,
} from "@/services/direct";
import { openConversation, parseConversationIdFromOpen } from "@/services/chat";
import { useAuth } from "@/context/AuthContext";

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  open: { label: "بدء التفاوض", status: "negotiating" },
  negotiating: { label: "تعيين / تأكيد", status: "assigned" },
  assigned: { label: "إغلاق الطلب (مكتمل)", status: "completed" },
};

export default function DirectOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const orderId = Number(id);
  const [order, setOrder] = useState<DirectOrder | null>(null);
  const [error, setError] = useState("");
  const [openingChat, setOpeningChat] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function reload() {
    if (!orderId) return;
    const o = await getDirectOrder(orderId);
    setOrder(o);
  }

  useEffect(() => {
    if (!requireAuth() || !orderId) return;
    reload().catch(() => setOrder(null));
  }, [orderId, requireAuth]);

  const isSeller =
    user?.userId != null &&
    order?.sellerUserId != null &&
    Number(user.userId) === Number(order.sellerUserId);

  const statusKey = order?.status?.toLowerCase() ?? "";
  const canAdvance = isSeller && NEXT_STATUS[statusKey];
  const canCancel =
    isSeller && statusKey && !["completed", "cancelled"].includes(statusKey);

  async function openChat() {
    if (!order?.orderId && order?.id == null) return;
    const oid = order.orderId ?? order.id!;
    setOpeningChat(true);
    setError("");
    try {
      const res = await openConversation("order", oid, {
        buyerUserId: order.buyerUserId,
        sellerUserId: order.sellerUserId,
      });
      const cid = parseConversationIdFromOpen(res);
      if (cid) router.push(`/chat/${cid}`);
      else if (order.chatId) router.push(`/chat/${order.chatId}`);
      else setError("تعذّر فتح المحادثة");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل فتح المحادثة");
    } finally {
      setOpeningChat(false);
    }
  }

  async function advanceStatus() {
    const next = NEXT_STATUS[statusKey];
    if (!next || !orderId) return;
    setUpdating(true);
    setError("");
    try {
      await updateDirectOrderStatus(orderId, next.status);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحديث الحالة");
    } finally {
      setUpdating(false);
    }
  }

  async function cancelOrder() {
    if (!orderId || !confirm("إلغاء هذا الطلب؟")) return;
    setUpdating(true);
    setError("");
    try {
      await cancelDirectOrder(orderId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإلغاء");
    } finally {
      setUpdating(false);
    }
  }

  if (!order) {
    return (
      <>
        <PageHeader title="تفاصيل الطلب" backHref="/orders/direct" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={order.listingTitle || order.cropName || `طلب #${orderId}`}
        backHref="/orders/direct"
      />
      <PageContainer narrow className="py-8">
        <article className="card space-y-6 p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={order.status} />
            {order.createdAt && (
              <span className="text-sm text-slate-500" suppressHydrationWarning>
                {formatDateAr(order.createdAt)}
              </span>
            )}
          </div>

          {order.qty != null && (
            <p>
              <span className="text-slate-500">الكمية: </span>
              <span className="font-medium">{order.qty}</span>
            </p>
          )}
          {order.totalPrice != null && (
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(order.totalPrice)}
            </p>
          )}
          {order.deliveryAddress && (
            <p>
              <span className="text-slate-500">العنوان: </span>
              {order.deliveryAddress}
            </p>
          )}

          <p className="text-sm text-slate-600">
            {isSeller ? "أنت البائع في هذا الطلب" : "أنت المشتري في هذا الطلب"}
          </p>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-3">
            <Button fullWidth disabled={openingChat} onClick={openChat}>
              {openingChat ? "جاري الفتح..." : "فتح المحادثة"}
            </Button>
            {canAdvance && (
              <Button fullWidth disabled={updating} onClick={advanceStatus}>
                {updating ? "جاري التحديث..." : canAdvance.label}
              </Button>
            )}
            {canCancel && (
              <Button fullWidth variant="outline" disabled={updating} onClick={cancelOrder}>
                إلغاء الطلب
              </Button>
            )}
          </div>
        </article>
      </PageContainer>
    </>
  );
}
