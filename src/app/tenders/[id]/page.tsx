"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getTender,
  getTenderOffers,
  createOffer,
  awardTender,
  finishTender,
} from "@/services/tenders";
import { formatPrice } from "@/lib/auctionPricing";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { canJoinTender } from "@/lib/permissions";
import type { Tender } from "@/types";

interface TenderOffer {
  offerId?: number;
  price?: number;
  quantityOffered?: number;
  supplierName?: string;
  status?: string;
  conversationId?: number | null;
  supplierUserId?: number | null;
}

export default function TenderDetailPage() {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [offers, setOffers] = useState<TenderOffer[]>([]);
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const tenderId = Number(id);
  const isOwner = user?.userId != null && tender?.createdByUserId === user.userId;
  const canAward = isOwner && ["open", "closed"].includes(tender?.status?.toLowerCase() ?? "");

  async function reloadOffers() {
    const list = await getTenderOffers(tenderId);
    setOffers(Array.isArray(list) ? (list as TenderOffer[]) : []);
  }

  useEffect(() => {
    if (!tenderId) return;
    getTender(tenderId).then(setTender).catch(() => {});
    reloadOffers().catch(() => setOffers([]));
  }, [tenderId]);

  async function submitOffer() {
    if (!requireAuth() || !user?.userId) return;
    setError("");
    try {
      await createOffer(user.userId, {
        tenderId,
        price: Number(price),
        quantityOffered: Number(qty),
      });
      setMsg(t("tenders.detail.offerSent"));
      await reloadOffers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tenders.detail.offerFailed"));
    }
  }

  async function handleAward(offerId: number) {
    setActing(offerId);
    setError("");
    try {
      await awardTender(tenderId, offerId);
      setMsg(t("tenders.detail.tenderAwarded"));
      getTender(tenderId).then(setTender);
      await reloadOffers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tenders.detail.awardFailed"));
    } finally {
      setActing(null);
    }
  }

  async function handleFinish() {
    setActing(-1);
    try {
      await finishTender(tenderId);
      setMsg(t("tenders.detail.tenderFinished"));
      getTender(tenderId).then(setTender);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tenders.detail.finishFailed"));
    } finally {
      setActing(null);
    }
  }

  if (!tender) {
    return (
      <>
        <PageHeader title={t("tenders.detail.title")} backHref="/tenders" />
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      </>
    );
  }

  const tenderTitle =
    localized(tender as unknown as LocalizableRecord) || tender.title || tender.cropName || t("tenders.detail.title");

  return (
    <>
      <PageHeader title={tenderTitle} backHref="/tenders" />
      <PageContainer className="py-8">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={tender.status} />
            {isOwner && <span className="text-xs text-emerald-600">{t("tenders.detail.owner")}</span>}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {localized(tender as unknown as LocalizableRecord) || tender.cropName || tender.title}
          </h2>
          {tender.quantity != null && (
            <p className="mt-2 text-slate-600">
              {t("tenders.detail.quantity", undefined, {
                qty: tender.quantity,
                unit: tender.unit ?? "",
              })}
            </p>
          )}
          {tender.maxBudget != null && (
            <p className="mt-1 font-bold text-emerald-600">
              {t("tenders.detail.budgetLabel", undefined, {
                price: formatPrice(tender.maxBudget),
              })}
            </p>
          )}
          {tender.deliveryLocation && (
            <p className="mt-1 text-sm text-slate-500">
              {t("tenders.detail.delivery", undefined, { location: tender.deliveryLocation })}
            </p>
          )}
        </div>

        {canAward && (
          <section className="mb-8 rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
            <h3 className="mb-3 font-semibold text-amber-900">{t("tenders.detail.manage")}</h3>
            <p className="mb-4 text-sm text-amber-800">{t("tenders.detail.manageHint")}</p>
            <Button variant="outline" disabled={acting != null} onClick={handleFinish}>
              {t("tenders.detail.finish")}
            </Button>
          </section>
        )}

        {!isOwner && canJoinTender(user?.roleId) && tender.status?.toLowerCase() === "open" && (
          <section className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
            <h3 className="mb-4 font-semibold">{t("tenders.detail.submitOffer")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("tenders.detail.offeredPrice")}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Input
                label={t("tenders.detail.quantityLabel")}
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <Button fullWidth className="mt-4" onClick={submitOffer}>
              {t("tenders.detail.sendOffer")}
            </Button>
          </section>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {msg && <p className="mb-4 text-sm text-emerald-700">{msg}</p>}

        {offers.length > 0 && (
          <section>
            <h3 className="mb-4 font-semibold text-slate-900">
              {t("tenders.detail.offers", undefined, { count: offers.length })}
            </h3>
            <ul className="space-y-3">
              {offers.map((o, i) => {
                const st = o.status?.toLowerCase() ?? "";
                const isPending = st === "active" || st === "pending";
                const isAwarded = st === "awarded" || st === "accepted";
                return (
                  <li
                    key={o.offerId ?? i}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-4"
                  >
                    <div>
                      <p className="font-medium">{o.supplierName || t("tenders.detail.supplier")}</p>
                      <p className="font-bold text-emerald-600">
                        {formatPrice(o.price ?? 0)} {t("common.currency")}
                        {o.quantityOffered != null && (
                          <span className="ms-2 text-sm font-normal text-slate-500">
                            · {t("tenders.detail.units", undefined, { qty: o.quantityOffered })}
                          </span>
                        )}
                      </p>
                      <StatusBadge status={o.status} />
                    </div>
                    {isOwner && isPending && o.offerId && (
                      <Button
                        size="sm"
                        disabled={acting != null}
                        onClick={() => handleAward(o.offerId!)}
                      >
                        {t("tenders.detail.award")}
                      </Button>
                    )}
                    {isAwarded && (isOwner || user?.userId === o.supplierUserId) && (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {t("tenders.detail.awarded")}
                        </span>
                        {o.conversationId != null && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/chat/${o.conversationId}`)}
                          >
                            {t("tenders.detail.conversation")}
                          </Button>
                        )}
                      </div>
                    )}
                    {isAwarded && !isOwner && user?.userId !== o.supplierUserId && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {t("tenders.detail.awarded")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </PageContainer>
    </>
  );
}
