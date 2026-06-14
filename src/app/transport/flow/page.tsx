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
import { useI18n } from "@/context/I18nContext";

function TransportFlowContent() {
  const { t } = useI18n();
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
          ? t("transport.flow.notifyCount", undefined, { count: res.notifiedTransporters })
          : res.notifyHint || t("transport.flow.notifySent"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.flow.notifyFailed"));
    }
  }

  async function handleAccept(offerId: number) {
    setActing(offerId);
    try {
      await acceptOffer(offerId);
      await loadRequest();
      setMsg(t("transport.flow.offerAccepted"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.flow.acceptFailed"));
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
      setError(e instanceof Error ? e.message : t("transport.flow.rejectFailed"));
    } finally {
      setActing(null);
    }
  }

  if (!deal) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">
        {t("transport.flow.openFromChat")}
      </PageContainer>
    );
  }

  return (
    <>
      <PageHeader
        title={t("transport.flow.title")}
        backHref={conversationId ? `/chat/${conversationId}` : "/chat"}
      />

      {deal && <TransportAssignPanel deal={deal} />}

      <PageContainer className="py-6">
        {request && (
          <article className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-semibold">
                {t("transport.flow.requestTitle", undefined, { id: request.requestId })}
              </h2>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-slate-600">
              {request.fromRegion} → {request.toRegion}
            </p>
            {["open", "negotiating"].includes(request.status?.toLowerCase() ?? "") && (
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleNotify}>
                {t("transport.flow.notifyTransporters")}
              </Button>
            )}
            <Link
              href={`/transport/requests/${request.requestId}`}
              className="mt-3 block text-sm font-medium text-emerald-600 hover:underline"
            >
              {t("transport.flow.fullDetails")}
            </Link>
          </article>
        )}

        {offers.length > 0 && (
          <section>
            <h3 className="mb-4 font-semibold">{t("transport.flow.transporterOffers")}</h3>
            <ul className="space-y-3">
              {offers.map((o) => (
                <li
                  key={o.offerId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
                >
                  <div>
                    <p className="font-medium">
                      {o.transporterName ||
                        t("transport.requestDetail.transporter", undefined, {
                          id: o.transportProviderId,
                        })}
                    </p>
                    <p className="font-bold text-emerald-600">{formatCurrency(o.offeredPrice ?? 0)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={acting != null} onClick={() => handleAccept(o.offerId)}>
                        {t("transport.requestDetail.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting != null}
                        onClick={() => handleReject(o.offerId)}
                      >
                        {t("transport.requestDetail.reject")}
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
            {t("transport.flow.backToChat")}
          </Button>
        )}
      </PageContainer>
    </>
  );
}

export default function TransportFlowPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      }
    >
      <TransportFlowContent />
    </Suspense>
  );
}
