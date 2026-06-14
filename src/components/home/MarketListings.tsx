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
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";
import {
  getAuctionDisplayPrice,
  getAuctionLocation,
  getListingLocation,
  getTenderLocation,
} from "@/lib/marketplace";
import { translateStatus } from "@/lib/status-labels";
import { useI18n } from "@/context/I18nContext";
import type { MarketTab } from "./MarketTabs";
import type { Auction, MarketplaceListing, Tender } from "@/types";

/** browse = الصفحة الرئيسية (marketplace/browse) | open = صفحات القسم مع فلترة API */
export type ListingsSource = "browse" | "open";

function displayTitle(
  marketTitle: ReturnType<typeof useLocalizedLabel>["marketTitle"],
  item: Auction | Tender | MarketplaceListing,
  kind: "auction" | "tender" | "direct",
  id: number,
  fallbackKey: string,
  t: ReturnType<typeof useI18n>["t"],
) {
  const fromHook = marketTitle(item as unknown as LocalizableRecord, kind);
  const idStr = String(id);
  if (fromHook && fromHook !== idStr) return fromHook;
  return t(fallbackKey, "", { id });
}

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
  const { t } = useI18n();
  const { marketTitle } = useLocalizedLabel();
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
        setError(t("market.loadError"));
        setAuctions([]);
        setTenders([]);
        setDirect([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [tab, debouncedSearch, categoryId, listFilters, source, t]);

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
        <p className="text-lg font-medium text-slate-700">{t("market.noListings")}</p>
        <p className="mt-2 text-sm text-slate-500">{t("market.noListingsHint")}</p>
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
            title={displayTitle(marketTitle, a, "auction", a.auctionId, "market.auctionFallback", t)}
            imageUrl={getAuctionMainImage(a)}
            price={getAuctionDisplayPrice(a)}
            priceLabel={t("market.currentPrice")}
            location={getAuctionLocation(a)}
            endTime={a.endTime}
            badge={t("market.badgeAuction")}
            meta={[
              a.cropQuantity != null ? `${a.cropQuantity} ${a.cropUnit || a.unit || ""}` : null,
              translateStatus(a.status, t),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ))}
      {tab === "tenders" &&
        tenders.map((tender) => (
          <ListingCard
            key={tender.tenderId}
            href={`/tenders/${tender.tenderId}`}
            title={displayTitle(marketTitle, tender, "tender", tender.tenderId, "market.tenderFallback", t)}
            imageUrl={getTenderMainImage(tender)}
            price={tender.maxBudget}
            priceLabel={t("market.budget")}
            location={getTenderLocation(tender)}
            endTime={tender.endTime}
            badge={t("market.badgeTender")}
            meta={[
              tender.quantity != null ? `${tender.quantity} ${tender.unit || ""}` : null,
              tender.deliveryLocation,
              translateStatus(tender.status, t),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ))}
      {tab === "direct" &&
        direct.map((l) => (
          <ListingCard
            key={l.listingId}
            href={`/direct/${l.listingId}/buy`}
            title={displayTitle(marketTitle, l, "direct", l.listingId, "market.directFallback", t)}
            imageUrl={getDirectMainImage(l)}
            price={l.unitPrice}
            priceLabel={t("market.unitPrice")}
            location={getListingLocation(l)}
            badge={t("market.badgeDirect")}
            meta={[
              l.availableQty != null
                ? t("market.availableQty", "", { qty: l.availableQty, unit: l.unit || "" })
                : null,
              l.minOrderQty != null
                ? t("market.minOrderQty", "", { qty: l.minOrderQty })
                : null,
              translateStatus(l.status, t),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ))}
    </div>
  );
}
