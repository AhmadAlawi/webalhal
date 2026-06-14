"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/auctionPricing";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { getAuctionMainImage } from "@/lib/media";
import { getAuctionDisplayPrice } from "@/lib/marketplace";
import type { LocalizableRecord } from "@/lib/localized-value";
import type { Auction } from "@/types";

function SuggestionItem({ auction }: { auction: Auction }) {
  const { t } = useI18n();
  const { marketTitle } = useLocalizedLabel();
  const fromTitle = marketTitle(auction as unknown as LocalizableRecord, "auction", auction.auctionId);
  const title =
    fromTitle && fromTitle !== String(auction.auctionId)
      ? fromTitle
      : t("auctions.auctionFallback", "", { id: auction.auctionId });
  const price = getAuctionDisplayPrice(auction);

  return (
    <Link
      href={`/auctions/${auction.auctionId}`}
      className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={getAuctionMainImage(auction)}
          alt=""
          fill
          className="object-cover"
          unoptimized
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</p>
        {price != null && (
          <p className="mt-0.5 text-xs font-bold text-emerald-600">
            {formatPrice(price)} {t("common.currency")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function AuctionSuggestionsSidebar({
  auctions,
  loading,
  currentAuctionId,
}: {
  auctions: Auction[];
  loading?: boolean;
  currentAuctionId?: number;
}) {
  const { t } = useI18n();
  const list = auctions.filter((a) => a.auctionId !== currentAuctionId).slice(0, 5);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">{t("auctions.suggestedTitle")}</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{t("auctions.noOtherAuctions")}</p>
        ) : (
          <ul className="space-y-2.5">
            {list.map((a) => (
              <li key={a.auctionId}>
                <SuggestionItem auction={a} />
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/auctions"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          {t("auctions.viewAllAuctions")}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
