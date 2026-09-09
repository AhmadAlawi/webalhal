"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAuction, getAuctionBids, getOpenAuctions } from "@/services/auctions";
import { AuctionBiddersList } from "@/components/auctions/AuctionBiddersList";
import { AuctionImageGallery } from "@/components/auctions/AuctionImageGallery";
import { AuctionSuggestionsSidebar } from "@/components/auctions/AuctionSuggestionsSidebar";
import { AuctionWinnerChatButton } from "@/components/auctions/AuctionWinnerChatButton";
import {
  formatPrice,
  getAuctionEndState,
  getAuctionSellerId,
  isAuctionOpen,
  parseAuctionPricing,
  type AuctionEndReason,
} from "@/lib/auctionPricing";
import { useAuth } from "@/context/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";
import { UserRole } from "@/types";
import type { Auction, AuctionPricing, Bid } from "@/types";

function formatDateTime(iso: string | undefined, language: "ar" | "en") {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = language === "ar" ? "ar-SY" : "en-US";
  return d.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function translateAuctionEndMessage(
  reason: AuctionEndReason,
  t: (key: string, fallback?: string, values?: Record<string, string | number | null | undefined>) => string,
): string {
  if (reason === "max_price") return t("auctions.endReasonMaxPrice");
  if (reason === "time") return t("auctions.endReasonTime");
  return t("auctions.ended");
}

function formatAuctionPrice(
  amount: number,
  t: (key: string) => string,
  perUnit?: number,
  unit?: string,
): string {
  const currency = t("common.currency");
  const total = `${formatPrice(amount)} ${currency}`;
  if (perUnit != null && unit) {
    return `${total} (${formatPrice(perUnit)} ${currency} / ${unit})`;
  }
  return total;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function AuctionBuyerDetails({
  auction,
  pricing,
}: {
  auction: Auction;
  pricing: AuctionPricing | null;
}) {
  const { t, language } = useI18n();
  const { localized } = useLocalizedLabel();

  const qty = pricing?.quantity ?? auction.cropQuantity ?? auction.quantity;
  const unit =
    (pricing?.unit ??
      auction.cropUnit ??
      auction.unit ??
      localized(auction as unknown as LocalizableRecord, "unit")) ||
    t("literal.كغ");
  const location = [auction.farmGovernorate ?? auction.governorateName, auction.farmCity ?? auction.cityName]
    .filter(Boolean)
    .join(" — ");

  const basisLabel =
    pricing?.bidAmountBasis === "perUnit"
      ? t("auctions.bidBasisPerUnit")
      : t("auctions.bidBasisTotal");

  const cropName =
    localized(auction as unknown as LocalizableRecord, "name") ||
    auction.cropName ||
    auction.productNameAr ||
    auction.auctionTitle;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{t("auctions.buyerDetails")}</h3>

      {auction.auctionDescription && (
        <p className="mb-4 text-sm leading-relaxed text-slate-600">{auction.auctionDescription}</p>
      )}

      <div className="divide-y divide-slate-100">
        <DetailRow label={t("auctions.crop")} value={cropName} />
        {qty != null && (
          <DetailRow label={t("auctions.quantityOffered")} value={`${formatPrice(qty)} ${unit}`} />
        )}
        <DetailRow label={t("auctions.bidBasis")} value={basisLabel} />
        <DetailRow
          label={t("auctions.startingPrice")}
          value={
            pricing
              ? formatAuctionPrice(
                  pricing.startingPriceTotal ?? auction.startingPrice ?? 0,
                  t,
                  pricing.startingPricePerUnit,
                  unit,
                )
              : auction.startingPrice != null
                ? formatAuctionPrice(auction.startingPrice, t)
                : null
          }
        />
        <DetailRow
          label={t("auctions.currentPrice")}
          value={
            pricing
              ? formatAuctionPrice(pricing.currentPriceTotal, t, pricing.currentPricePerUnit, unit)
              : auction.currentPrice != null
                ? formatAuctionPrice(auction.currentPrice, t)
                : null
          }
        />
        <DetailRow
          label={t("auctions.minIncrement")}
          value={
            pricing
              ? formatAuctionPrice(pricing.minIncrementTotal, t, pricing.minIncrementPerUnit, unit)
              : auction.minIncrement != null
                ? formatAuctionPrice(auction.minIncrement, t)
                : null
          }
        />
        <DetailRow
          label={t("auctions.maxPrice")}
          value={
            pricing?.maxPriceTotal != null
              ? formatAuctionPrice(pricing.maxPriceTotal, t, pricing.maxPricePerUnit ?? undefined, unit)
              : auction.maxPrice != null
                ? formatAuctionPrice(auction.maxPrice, t)
                : null
          }
        />
        <DetailRow label={t("auctions.auctionStart")} value={formatDateTime(auction.startTime, language)} />
        <DetailRow label={t("auctions.auctionEnd")} value={formatDateTime(auction.endTime, language)} />
        {auction.secondEndTime && (
          <DetailRow
            label={t("auctions.secondEnd")}
            value={formatDateTime(auction.secondEndTime, language)}
          />
        )}
        {location && <DetailRow label={t("auctions.location")} value={location} />}
        {auction.bidsCount != null && (
          <DetailRow label={t("auctions.bidsCount")} value={String(auction.bidsCount)} />
        )}
      </div>
    </section>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, requireAuth } = useAuth();
  const { canJoinAuction, roleLabel: accountRoleLabel } = useUserPermissions();
  const { t, language } = useI18n();
  const { marketTitle } = useLocalizedLabel();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [suggested, setSuggested] = useState<Auction[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const auctionId = Number(id);

  useEffect(() => {
    if (!auctionId) return;
    getAuction(auctionId).then(setAuction).catch(() => {});
    getAuctionBids(auctionId).then(setBids).catch(() => setBids([]));
  }, [auctionId]);

  useEffect(() => {
    getOpenAuctions({ pageSize: "8", sortOrder: "desc" })
      .then(setSuggested)
      .catch(() => setSuggested([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const pricing = useMemo(
    () => (auction ? parseAuctionPricing(auction.pricing ?? auction) : null),
    [auction],
  );

  if (!auction) {
    return (
      <>
        <PageHeader title={t("auctions.detailTitle")} backHref="/auctions" />
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      </>
    );
  }

  const sellerId = getAuctionSellerId(auction);
  const isOwner = user?.userId != null && sellerId === user.userId;
  const open = isAuctionOpen(auction);
  const traderCanJoin = canJoinAuction;
  const showJoin = open && !isOwner && traderCanJoin;
  const endState = getAuctionEndState(auction, pricing);
  const auctionEnded = endState.ended;
  const endMessage = auctionEnded
    ? translateAuctionEndMessage(endState.reason, t)
    : "";
  const statusLabel = (auction.status ?? auction.lifecycleStatus ?? "").toLowerCase() || undefined;

  function goToJoin() {
    if (!requireAuth()) return;
    router.push(`/auctions/${auctionId}/join`);
  }

  const displayPrice =
    pricing?.currentPriceTotal ?? auction.currentPrice ?? auction.startingPrice ?? 0;

  const fromTitle = marketTitle(auction as unknown as LocalizableRecord, "auction", auctionId);
  const pageTitle =
    fromTitle && fromTitle !== String(auctionId)
      ? fromTitle
      : t("auctions.auctionFallback", "", { id: auctionId });

  const displayUnit =
    pricing?.unit ??
    auction.cropUnit ??
    auction.unit ??
    t("literal.كغ");

  return (
    <>
      <PageHeader title={pageTitle} backHref="/auctions" />
      <AuctionImageGallery auction={auction} title={pageTitle} />
      <PageContainer className="py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
          <div className="order-2 space-y-6 lg:order-1">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={statusLabel} />
                {open && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {t("auctions.biddable")}
                  </span>
                )}
                {isOwner && (
                  <span className="text-xs font-medium text-amber-700">{t("auctions.yourAuction")}</span>
                )}
                {accountRoleLabel && (
                  <span className="text-xs text-slate-500">
                    {t("auctions.yourAccount", "", { role: accountRoleLabel })}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">{pageTitle}</h2>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {formatPrice(displayPrice)} {t("common.currency")}
              </p>
              {pricing && (
                <p className="mt-1 text-sm text-slate-500">
                  {t("auctions.pricePerUnit", "", {
                    price: `${formatPrice(pricing.currentPricePerUnit)} ${t("common.currency")}`,
                    unit: displayUnit,
                  })}
                </p>
              )}
              {auction.endTime && (
                <p className="mt-2 text-slate-500">
                  {t("auctions.endsAt", "", { date: formatDateTime(auction.endTime, language) })}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="text-center text-sm text-amber-800">{t("auctions.ownerNotice")}</p>
                <Button fullWidth variant="outline" onClick={() => router.push(`/auctions/${auctionId}/edit`)}>
                  {t("auctions.editAuction")}
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => router.push(`/auctions/${auctionId}/join`)}
                >
                  {t("auctions.monitorAuction")}
                </Button>
              </div>
            )}

            {showJoin && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Gavel className="h-5 w-5" />
                  {t("auctions.joinTitle")}
                </h3>
                <p className="text-sm text-emerald-800">{t("auctions.joinDescription")}</p>
                <Button fullWidth size="lg" onClick={goToJoin}>
                  {t("auctions.joinAndBid")}
                </Button>
              </div>
            )}

            {!isOwner && !traderCanJoin && open && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {isAuthenticated ? (
                  user?.roleId === UserRole.Farmer ? (
                    <p>
                      {t("auctions.farmerCannotBidPrefix")}{" "}
                      <strong>{t("auctions.traders")}</strong>
                      {t("auctions.farmerCannotBidSuffix")}
                    </p>
                  ) : (
                    <p>{t("auctions.noJoinPermission")}</p>
                  )
                ) : (
                  <p>
                    <Link href="/login" className="font-semibold text-emerald-700 underline">
                      {t("auctions.loginAsTrader")}
                    </Link>{" "}
                    {t("auctions.loginAsTraderSuffix")}
                  </p>
                )}
              </div>
            )}

            {auctionEnded && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="mb-3 text-center text-sm font-medium text-emerald-900">{endMessage}</p>
                <AuctionWinnerChatButton
                  auction={auction}
                  bids={bids}
                  userId={user?.userId}
                  sublabel={t("auctions.winnerCongrats")}
                />
              </div>
            )}

            {!open && !isOwner && !auctionEnded && (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
                {t("auctions.notOpenForBidding")}
              </p>
            )}

            {!isAuthenticated && open && (
              <Button fullWidth size="lg" onClick={() => requireAuth()}>
                {t("auctions.loginToJoin")}
              </Button>
            )}

            <AuctionBuyerDetails auction={auction} pricing={pricing} />

            <AuctionSuggestionsSidebar
              auctions={suggested}
              loading={suggestionsLoading}
              currentAuctionId={auctionId}
            />
          </div>

          <AuctionBiddersList bids={bids} className="order-1 lg:order-2" />
        </div>
      </PageContainer>
    </>
  );
}
