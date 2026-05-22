"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { TransportAssignPanel } from "@/components/transport/TransportAssignPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import {
  acceptOffer,
  getTransportByContext,
  getTransportRequest,
  notifyTransportRequest,
  rejectOffer,
  type TransportOffer,
} from "@/services/transport";
import type { TransportRequestDetail } from "@/types/transport";
import { getConversation } from "@/services/chat";
import { useAuth } from "@/context/AuthContext";

function TransportFlowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requireAuth } = useAuth();

  const conversationId = Number(searchParams.get("conversationId"));
  const orderType = searchParams.get("orderType") ?? "";
  const orderId = Number(searchParams.get("orderId"));

  const [request, setRequest] = useState<TransportRequestDetail | null>(null);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [farmCityId, setFarmCityId] = useState<number | undefined>();
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const deal =
    conversationId && orderType && orderId
      ? { conversationId, orderType, orderId, farmCityId }
      : null;

  const loadRequest = async () => {
    if (!orderType || !orderId) return;
    const ctx = await getTransportByContext(orderType, orderId).catch(() => null);
    if (ctx?.requestId) {
      const detail = await getTransportRequest(ctx.requestId);
      setRequest(detail);
      setOffers((detail as { offers?: TransportOffer[] })?.offers ?? []);
      return;
    }
    setRequest(null);
    setOffers([]);
  };

  useEffect(() => {
    if (!requireAuth()) return;
    if (conversationId) {
      getConversation(conversationId)
        .then((c) => {
          setFarmCityId(c.farmCityId);
        })
        .catch(() => {});
    }
    loadRequest();
  }, [conversationId, orderType, orderId, requireAuth]);

  async function handleNotify() {
    if (!request?.requestId) return;
    try {
      const res = await notifyTransportRequest(request.requestId);
      setMsg(
        res.notifiedTransporters != null
          ? `تم إشعار ${res.notifiedTransporters} ناقل`
          : res.notifyHint || "تم الإرسال",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإشعار");
    }
  }

  async function handleAccept(offerId: number) {
    setActing(offerId);
    try {
      await acceptOffer(offerId);
      await loadRequest();
      setMsg("تم قبول العرض");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل القبول");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(offerId: number) {
    setActing(offerId);
    try {
      await rejectOffer(offerId);
      await loadRequest();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفض");
    } finally {
      setActing(null);
    }
  }

  if (!deal) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">
        افتح هذه الصفحة من محادثة صفقة (مزاد / مناقصة / بيع مباشر)
      </PageContainer>
    );
  }

  return (
    <>
      <PageHeader
        title="إدارة نقل الصفقة"
        backHref={conversationId ? `/chat/${conversationId}` : "/chat"}
      />

      {deal && <TransportAssignPanel deal={deal} />}

      <PageContainer className="py-6">
        {request && (
          <article className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-semibold">طلب النقل #{request.requestId}</h2>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-slate-600">
              {request.fromRegion} → {request.toRegion}
            </p>
            {["open", "negotiating"].includes(request.status?.toLowerCase() ?? "") && (
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleNotify}>
                إعادة إشعار الناقلين
              </Button>
            )}
            <Link
              href={`/transport/requests/${request.requestId}`}
              className="mt-3 block text-sm font-medium text-emerald-600 hover:underline"
            >
              تفاصيل كاملة للطلب
            </Link>
          </article>
        )}

        {offers.length > 0 && (
          <section>
            <h3 className="mb-4 font-semibold">عروض الناقلين</h3>
            <ul className="space-y-3">
              {offers.map((o) => (
                <li
                  key={o.offerId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
                >
                  <div>
                    <p className="font-medium">{o.transporterName || `ناقل #${o.transportProviderId}`}</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(o.offeredPrice ?? 0)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={acting != null} onClick={() => handleAccept(o.offerId)}>
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting != null}
                        onClick={() => handleReject(o.offerId)}
                      >
                        رفض
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {conversationId > 0 && (
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => router.push(`/chat/${conversationId}`)}
          >
            العودة للمحادثة
          </Button>
        )}
      </PageContainer>
    </>
  );
}

export default function TransportFlowPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      }
    >
      <TransportFlowContent />
    </Suspense>
  );
}
