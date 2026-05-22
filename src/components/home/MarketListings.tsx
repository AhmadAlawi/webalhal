"use client";

import { useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/cards/ListingCard";
import { getOpenAuctions } from "@/services/auctions";
import { getFilteredTenders } from "@/services/tenders";
import { getFilteredDirectListings, getMarketplaceBrowse } from "@/services/marketplace";
import { getAuctionMainImage, getDirectMainImage, getTenderMainImage } from "@/lib/media";
import { buildMarketListParams } from "@/lib/list-query-params";
import {
  filtersToQueryParams,
  type MarketListFilterState,
} from "@/lib/market-list-filters";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getAuctionDisplayPrice,
  getAuctionLocation,
  getListingLocation,
  getTenderLocation,
} from "@/lib/marketplace";
import type { MarketTab } from "./MarketTabs";
import type { Auction, MarketplaceListing, Tender } from "@/types";

/** browse = الصفحة الرئيسية (marketplace/browse) | open = صفحات القسم مع فلترة API */
export type ListingsSource = "browse" | "open";

export function MarketListings({
  tab,
  searchQuery,
  categoryId,
  listFilters,
  source = "browse",
}: {
  tab: MarketTab;
  searchQuery: string;
  categoryId?: number;
  listFilters?: MarketListFilterState;
  source?: ListingsSource;
}) {
  const debouncedSearch = useDebounce(searchQuery, 450);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [direct, setDirect] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    const kind = tab === "auctions" ? "auctions" : tab === "tenders" ? "tenders" : "direct";
    const extra = listFilters ? filtersToQueryParams(listFilters, kind) : {};
    const params = buildMarketListParams(
      debouncedSearch,
      listFilters?.categoryId ?? categoryId,
      extra,
    );

    const load = async () => {
      if (ac.signal.aborted) return;

      if (source === "open") {
        if (tab === "auctions") {
          const list = await getOpenAuctions(params);
          if (!ac.signal.aborted) setAuctions(list);
          return;
        }
        if (tab === "tenders") {
          const list = await getFilteredTenders(params);
          if (!ac.signal.aborted) setTenders(list);
          return;
        }
        const list = await getFilteredDirectListings(params);
        if (!ac.signal.aborted) setDirect(list);
        return;
      }

      const browse = await getMarketplaceBrowse(params);
      if (ac.signal.aborted) return;
      setAuctions(browse.auctions);
      setTenders(browse.tenders);
      setDirect(browse.direct);
    };

    load()
      .catch(() => {
        if (ac.signal.aborted) return;
        setError("تعذّر تحميل البيانات. تحقق من الاتصال.");
        setAuctions([]);
        setTenders([]);
        setDirect([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [tab, debouncedSearch, categoryId, listFilters, source]);

  const items =
    tab === "auctions" ? auctions : tab === "tenders" ? tenders : direct;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-slate-500">{error}</p>;
  }

  if (!items.length) {
    return (
      <div className="card py-16 text-center">
        <p className="text-lg font-medium text-slate-700">لا توجد عروض حالياً</p>
        <p className="mt-2 text-sm text-slate-500">جرّب تغيير البحث أو التصنيف</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tab === "auctions" &&
        auctions.map((a) => (
          <ListingCard
            key={a.auctionId}
            href={`/auctions/${a.auctionId}`}
            title={a.auctionTitle || a.productNameAr || a.cropName || `مزاد #${a.auctionId}`}
            imageUrl={getAuctionMainImage(a)}
            price={getAuctionDisplayPrice(a)}
            priceLabel="السعر الحالي"
            location={getAuctionLocation(a)}
            endTime={a.endTime}
            badge="مزاد"
          />
        ))}
      {tab === "tenders" &&
        tenders.map((t) => (
          <ListingCard
            key={t.tenderId}
            href={`/tenders/${t.tenderId}`}
            title={t.title || t.productNameAr || t.cropName || `مناقصة #${t.tenderId}`}
            imageUrl={getTenderMainImage(t)}
            price={t.maxBudget}
            priceLabel="الميزانية"
            location={getTenderLocation(t)}
            endTime={t.endTime}
            badge="مناقصة"
          />
        ))}
      {tab === "direct" &&
        direct.map((l) => (
          <ListingCard
            key={l.listingId}
            href={`/direct/${l.listingId}/buy`}
            title={l.title || l.productNameAr || l.cropName || `عرض #${l.listingId}`}
            imageUrl={getDirectMainImage(l)}
            price={l.unitPrice}
            priceLabel="سعر الوحدة"
            location={getListingLocation(l)}
            badge="بيع مباشر"
          />
        ))}
    </div>
  );
}
