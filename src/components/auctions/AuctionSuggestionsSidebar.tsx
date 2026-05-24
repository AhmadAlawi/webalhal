"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/auctionPricing";
import { getAuctionMainImage } from "@/lib/media";
import { getAuctionDisplayPrice } from "@/lib/marketplace";
import type { Auction } from "@/types";

function SuggestionItem({ auction }: { auction: Auction }) {
  const title =
    auction.auctionTitle || auction.cropName || auction.productNameAr || `مزاد #${auction.auctionId}`;
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
          <p className="mt-0.5 text-xs font-bold text-emerald-600">{formatPrice(price)} ل.س</p>
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
  const list = auctions.filter((a) => a.auctionId !== currentAuctionId).slice(0, 5);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">مزادات مقترحة</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">لا توجد مزادات أخرى حالياً</p>
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
          عرض كل المزادات
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
