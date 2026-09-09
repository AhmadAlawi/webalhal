"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  acceptOffer,
  getTransportRequest,
  rejectOffer,
  notifyTransportRequest,
  getTransportTracking,
  cancelTransportRequest,
  type TransportTrackingPoint,
} from "@/services/transport";
import type { TransportOffer } from "@/services/transport";
import type { TransportRequestDetail } from "@/types/transport";
import { formatCurrency } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useI18n } from "@/context/I18nContext";

export default function TransportRequestDetailPage() {
  const { t, language } = useI18n();
  const { id } = useParams();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [req, setReq] = useState<TransportRequestDetail | null>(null);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [tracking, setTracking] = useState<TransportTrackingPoint[]>([]);
  const [notifyMsg, setNotifyMsg] = useState("");

  const requestId = Number(id);
  const dateLocale = language === "ar" ? "ar-SY" : "en-US";

  const load = () => {
    getTransportRequest(requestId)
      .then((d) => {
        setReq(d);
        setOffers((d as { offers?: TransportOffer[] })?.offers ?? []);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("transport.requestDetail.loadFailed")),
      );
    getTransportTracking(requestId).then(setTracking).catch(() => setTracking([]));
  };

  async function handleNotify() {
    try {
      const res = await notifyTransportRequest(requestId);
      setNotifyMsg(
        res.notifiedTransporters != null
          ? t("transport.requestDetail.notifyCount", undefined, {
              count: res.notifiedTransporters,
            })
          : res.notifyHint || t("transport.requestDetail.notifySent"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.requestDetail.notifyFailed"));
    }
  }

  async function handleCancel() {
    if (!confirm(t("transport.requestDetail.cancelConfirm"))) return;
    try {
      await cancelTransportRequest(requestId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.requestDetail.cancelFailed"));
    }
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated || !requestId) return;
    load();
  }, [requestId, isLoading, isAuthenticated]);

  async function handleAccept(offerId: number) {
    setActing(offerId);
    try {
      await acceptOffer(offerId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.requestDetail.acceptFailed"));
    } finally {
      setActing(null);
    }
  }

  async function handleReject(offerId: number) {
    setActing(offerId);
    try {
      await rejectOffer(offerId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.requestDetail.rejectFailed"));
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t("transport.requestDetail.title", undefined, { id: requestId })}
        backHref="/transport/requests"
      />
      <PageContainer className="py-6">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>
        )}
        {req && (
          <article className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge status={req.status} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">{t("transport.requestDetail.from")}</dt>
                <dd className="font-medium">{req.fromRegion ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("transport.requestDetail.to")}</dt>
                <dd className="font-medium">{req.toRegion ?? "—"}</dd>
              </div>
              {req.agreedPrice != null && (
                <div>
                  <dt className="text-slate-500">{t("transport.requestDetail.agreedPrice")}</dt>
                  <dd className="font-medium text-emerald-600">
                    {formatCurrency(req.agreedPrice)}
                  </dd>
                </div>
              )}
              {req.productType && (
                <div>
                  <dt className="text-slate-500">{t("transport.requestDetail.product")}</dt>
                  <dd className="font-medium">{req.productType}</dd>
                </div>
              )}
            </dl>
            {req.status?.toLowerCase() === "assigned" && (
              <p className="mt-6 text-sm text-emerald-700">
                {t("transport.requestDetail.assignedMessage")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleNotify}>
                {t("transport.requestDetail.notifyTransporters")}
              </Button>
              {["open", "negotiating"].includes(req.status?.toLowerCase() ?? "") && (
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
            {notifyMsg && <p className="mt-2 text-sm text-emerald-700">{notifyMsg}</p>}
            <Link
              href="/chat"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline"
            >
              {t("transport.requestDetail.conversations")}
            </Link>
          </article>
        )}

        {tracking.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-slate-900">
              {t("transport.requestDetail.tracking")}
            </h2>
            <ul className="space-y-2 rounded-xl border bg-white p-4">
              {tracking.map((p, i) => (
                <li key={p.trackingId ?? i} className="text-sm text-slate-600">
                  {p.recordedAt && new Date(p.recordedAt).toLocaleString(dateLocale)}
                  {p.latitude != null && p.longitude != null && (
                    <span className="ms-2">
                      ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)})
                    </span>
                  )}
                  {p.notes && <span className="block text-slate-500">{p.notes}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {offers.length > 0 && (
          <section>
            <h2 className="mb-4 font-semibold text-slate-900">
              {t("transport.requestDetail.transporterOffers")}
            </h2>
            <ul className="space-y-3">
              {offers.map((o) => (
                <li
                  key={o.offerId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div>
                    <p className="font-medium">
                      {o.transporterName ||
                        t("transport.requestDetail.transporter", undefined, {
                          id: o.transportProviderId ?? o.transporterId,
                        })}
                    </p>
                    <p className="font-bold text-emerald-600">
                      {formatCurrency(o.offeredPrice ?? 0)}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={acting === o.offerId}
                        onClick={() => handleAccept(o.offerId)}
                      >
                        {t("transport.requestDetail.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting === o.offerId}
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
      </PageContainer>
    </>
  );
}
