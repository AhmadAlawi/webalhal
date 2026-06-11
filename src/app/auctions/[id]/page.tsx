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
} from "@/lib/auctionPricing";
import { useAuth } from "@/context/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UserRole } from "@/types";
import type { Auction, AuctionPricing, Bid } from "@/types";

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ar-SY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  const qty = pricing?.quantity ?? auction.cropQuantity ?? auction.quantity;
  const unit = pricing?.unit ?? auction.cropUnit ?? auction.unit ?? "كغ";
  const location = [auction.farmGovernorate ?? auction.governorateName, auction.farmCity ?? auction.cityName]
    .filter(Boolean)
    .join(" — ");

  const basisLabel =
    pricing?.bidAmountBasis === "perUnit" ? "سعر للوحدة (يُحسب الإجمالي تلقائياً)" : "مبلغ إجمالي للكمية كاملة";

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">تفاصيل للمشتري</h3>

      {auction.auctionDescription && (
        <p className="mb-4 text-sm leading-relaxed text-slate-600">{auction.auctionDescription}</p>
      )}

      <div className="divide-y divide-slate-100">
        <DetailRow
          label="المحصول"
          value={auction.cropName || auction.productNameAr || auction.auctionTitle}
        />
        {qty != null && (
          <DetailRow label="الكمية المعروضة" value={`${formatPrice(qty)} ${unit}`} />
        )}
        <DetailRow label="أساس المزايدة" value={basisLabel} />
        <DetailRow
          label="سعر البداية"
          value={
            pricing
              ? `${formatPrice(pricing.startingPriceTotal ?? auction.startingPrice ?? 0)} ل.س` +
                (pricing.startingPricePerUnit
                  ? ` (${formatPrice(pricing.startingPricePerUnit)} ل.س / ${unit})`
                  : "")
              : auction.startingPrice != null
                ? `${formatPrice(auction.startingPrice)} ل.س`
                : null
          }
        />
        <DetailRow
          label="السعر الحالي"
          value={
            pricing
              ? `${formatPrice(pricing.currentPriceTotal)} ل.س` +
                (pricing.currentPricePerUnit
                  ? ` (${formatPrice(pricing.currentPricePerUnit)} ل.س / ${unit})`
                  : "")
              : auction.currentPrice != null
                ? `${formatPrice(auction.currentPrice)} ل.س`
                : null
          }
        />
        <DetailRow
          label="أقل زيادة للمزايدة"
          value={
            pricing
              ? `${formatPrice(pricing.minIncrementTotal)} ل.س` +
                (pricing.minIncrementPerUnit
                  ? ` (${formatPrice(pricing.minIncrementPerUnit)} ل.س / ${unit})`
                  : "")
              : auction.minIncrement != null
                ? `${formatPrice(auction.minIncrement)} ل.س`
                : null
          }
        />
        <DetailRow
          label="السقف الأعلى (حد أقصى)"
          value={
            pricing?.maxPriceTotal != null
              ? `${formatPrice(pricing.maxPriceTotal)} ل.س` +
                (pricing.maxPricePerUnit
                  ? ` (${formatPrice(pricing.maxPricePerUnit)} ل.س / ${unit})`
                  : "")
              : auction.maxPrice != null
                ? `${formatPrice(auction.maxPrice)} ل.س`
                : null
          }
        />
        <DetailRow label="بداية المزاد" value={formatDateTime(auction.startTime)} />
        <DetailRow label="نهاية المزاد" value={formatDateTime(auction.endTime)} />
        {auction.secondEndTime && (
          <DetailRow label="النهاية الثانية (تمديد)" value={formatDateTime(auction.secondEndTime)} />
        )}
        {location && <DetailRow label="الموقع" value={location} />}
        {auction.bidsCount != null && (
          <DetailRow label="عدد المزايدات" value={String(auction.bidsCount)} />
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
        <PageHeader title="تفاصيل المزاد" backHref="/auctions" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
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
  const statusLabel = (auction.status ?? auction.lifecycleStatus ?? "").toLowerCase() || undefined;

  function goToJoin() {
    if (!requireAuth()) return;
    router.push(`/auctions/${auctionId}/join`);
  }

  const displayPrice =
    pricing?.currentPriceTotal ?? auction.currentPrice ?? auction.startingPrice ?? 0;

  const pageTitle = auction.auctionTitle || auction.cropName || "مزاد";

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
                    قابل للمزايدة
                  </span>
                )}
                {isOwner && (
                  <span className="text-xs font-medium text-amber-700">مزادك</span>
                )}
                {accountRoleLabel && (
                  <span className="text-xs text-slate-500">حسابك: {accountRoleLabel}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">
                {auction.auctionTitle || auction.cropName || auction.productNameAr}
              </h2>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {formatPrice(displayPrice)} ل.س
              </p>
              {pricing && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatPrice(pricing.currentPricePerUnit)} ل.س /{" "}
                  {pricing.unit ?? auction.cropUnit ?? "كغ"}
                </p>
              )}
              {auction.endTime && (
                <p className="mt-2 text-slate-500">ينتهي: {formatDateTime(auction.endTime)}</p>
              )}
            </div>

            {isOwner && (
              <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="text-center text-sm text-amber-800">أنت صاحب هذا المزاد</p>
                <Button fullWidth variant="outline" onClick={() => router.push(`/auctions/${auctionId}/edit`)}>
                  تعديل المزاد
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => router.push(`/auctions/${auctionId}/join`)}
                >
                  متابعة المزاد (عرض المزايدات)
                </Button>
              </div>
            )}

            {showJoin && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Gavel className="h-5 w-5" />
                  انضمام للمزاد
                </h3>
                <p className="text-sm text-emerald-800">
                  للمشاركة في المزايدة اضغط انضمام — سيتم فتح صفحة المزايدة المباشرة.
                </p>
                <Button fullWidth size="lg" onClick={goToJoin}>
                  انضمام للمزاد والمزايدة
                </Button>
              </div>
            )}

            {!isOwner && !traderCanJoin && open && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {isAuthenticated ? (
                  user?.roleId === UserRole.Farmer ? (
                    <p>
                      المزايدة متاحة لحسابات <strong>التجار</strong>. يمكنك مشاهدة التفاصيل كمزارع
                      لكن لا يمكنك الانضمام كمشتري على مزادك أو مزادات أخرى بهذا الحساب.
                    </p>
                  ) : (
                    <p>لا تملك صلاحية الانضمام لهذا المزاد بحسابك الحالي.</p>
                  )
                ) : (
                  <p>
                    <Link href="/login" className="font-semibold text-emerald-700 underline">
                      سجّل الدخول
                    </Link>{" "}
                    بحساب تاجر للانضمام والمزايدة.
                  </p>
                )}
              </div>
            )}

            {auctionEnded && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="mb-3 text-center text-sm font-medium text-emerald-900">
                  {endState.message}
                </p>
                <AuctionWinnerChatButton
                  auction={auction}
                  bids={bids}
                  userId={user?.userId}
                  sublabel="مبروك! فزت بهذا المزاد"
                />
              </div>
            )}

            {!open && !isOwner && !auctionEnded && (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
                هذا المزاد غير مفتوح للمزايدة حالياً.
              </p>
            )}

            {!isAuthenticated && open && (
              <Button fullWidth size="lg" onClick={() => requireAuth()}>
                سجّل الدخول للانضمام
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
