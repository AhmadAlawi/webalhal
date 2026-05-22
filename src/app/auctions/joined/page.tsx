"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ListingCard } from "@/components/cards/ListingCard";
import { getJoinedAuctions } from "@/services/auctions";
import { getAuctionDisplayPrice, getAuctionLocation } from "@/lib/marketplace";
import { getAuctionMainImage } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";
import type { Auction } from "@/types";

export default function JoinedAuctionsPage() {
  const { user, requireAuth } = useAuth();
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth() || !user?.userId) return;
    getJoinedAuctions(user.userId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [requireAuth, user?.userId]);

  return (
    <>
      <PageHeader title="مزاداتي — مشاركاتي" backHref="/account" />
      <PageContainer className="py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-slate-500">لم تشارك في مزادات بعد</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ListingCard
                key={a.auctionId}
                href={`/auctions/${a.auctionId}`}
                title={a.auctionTitle || a.cropName || `مزاد #${a.auctionId}`}
                imageUrl={getAuctionMainImage(a)}
                price={getAuctionDisplayPrice(a)}
                priceLabel="السعر"
                location={getAuctionLocation(a)}
                endTime={a.endTime}
                badge="مزاد"
              />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm">
          <Link href="/auctions" className="text-emerald-600 hover:underline">
            تصفح كل المزادات
          </Link>
        </p>
      </PageContainer>
    </>
  );
}
