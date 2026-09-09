"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import {
  getTransportRequest,
  submitTransportOffer,
  getMyTransportProvider,
} from "@/services/transport";
import type { TransportRequestDetail } from "@/types/transport";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { UserRole } from "@/types";

export default function TransportInboxDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const { user, requireAuth } = useAuth();
  const requestId = Number(id);
  const [req, setReq] = useState<TransportRequestDetail | null>(null);
  const [price, setPrice] = useState("");
  const [providerId, setProviderId] = useState<number | "">("");
  const [providerLocked, setProviderLocked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!requireAuth() || !requestId) return;
    getTransportRequest(requestId).then(setReq).catch(() => setReq(null));
  }, [requestId, requireAuth]);

  useEffect(() => {
    if (!user?.userId) return;
    getMyTransportProvider(user.userId)
      .then((p) => {
        const pid = p?.transportProviderId;
        if (pid) {
          setProviderId(pid);
          setProviderLocked(true);
        }
      })
      .catch(() => undefined);
  }, [user?.userId]);

  async function submitOffer() {
    if (!user?.userId || !providerId || !price) {
      setError(t("transport.inboxDetail.enterPrice"));
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await submitTransportOffer({
        transportRequestId: requestId,
        transporterId: Number(providerId),
        offeredPrice: Number(price),
        estimatedPickupDate: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      });
      setSuccess(t("transport.inboxDetail.offerSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.inboxDetail.offerFailed"));
    } finally {
      setSending(false);
    }
  }

  if (user?.roleId !== UserRole.Transport) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        {t("transport.transportersOnly")}
      </PageContainer>
    );
  }

  return (
    <>
      <PageHeader
        title={t("transport.inboxDetail.title", undefined, { id: requestId })}
        backHref="/transport/inbox"
      />
      <PageContainer className="py-8">
        {!req ? (
          <p className="text-center text-slate-500">{t("common.loadingEllipsis")}</p>
        ) : (
          <div className="space-y-6">
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={req.status} />
              </div>
              <p className="text-lg font-semibold">
                {req.productType || t("transport.inboxDetail.requestFallback")}
              </p>
              <p className="mt-2 text-slate-600">
                {req.fromRegion} → {req.toRegion}
              </p>
              {req.weightKg != null && (
                <p className="mt-1 text-sm text-slate-500">
                  {t("transport.inboxDetail.weight", undefined, { kg: req.weightKg })}
                </p>
              )}
            </article>

            {(req.status === "open" || req.status === "negotiating") && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6">
                <h2 className="mb-4 font-semibold text-slate-900">
                  {t("transport.inboxDetail.submitOffer")}
                </h2>
                <Input
                  label={t("transport.inboxDetail.providerId")}
                  type="number"
                  value={providerId === "" ? "" : String(providerId)}
                  onChange={(e) =>
                    setProviderId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={providerLocked}
                />
                <Input
                  label={t("transport.inboxDetail.offeredPrice")}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-700">{success}</p>}
                <Button fullWidth className="mt-4" onClick={submitOffer} disabled={sending}>
                  {t("transport.inboxDetail.sendOffer")}
                </Button>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
