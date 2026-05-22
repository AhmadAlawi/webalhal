"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { getDirectOrder, type DirectOrder } from "@/services/direct";
import { openConversation, parseConversationIdFromOpen } from "@/services/chat";
import { useAuth } from "@/context/AuthContext";

export default function DirectOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const orderId = Number(id);
  const [order, setOrder] = useState<DirectOrder | null>(null);
  const [error, setError] = useState("");
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (!requireAuth() || !orderId) return;
    getDirectOrder(orderId).then(setOrder).catch(() => setOrder(null));
  }, [orderId, requireAuth]);

  const isSeller =
    user?.userId != null && order?.sellerUserId != null &&
    Number(user.userId) === Number(order.sellerUserId);

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
      else setError("تعذّر فتح المحادثة");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل فتح المحادثة");
    } finally {
      setOpeningChat(false);
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
        <article className="space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            {order.createdAt && (
              <span className="text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleString("ar-SY")}
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button fullWidth disabled={openingChat} onClick={openChat}>
            {openingChat ? "جاري الفتح..." : "فتح المحادثة"}
          </Button>
        </article>
      </PageContainer>
    </>
  );
}
