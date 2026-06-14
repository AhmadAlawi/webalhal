"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAuctionLocation, getListingLocation, getTenderLocation } from "@/lib/marketplace";
import { formatCurrencyLocalized, translateStatus } from "@/lib/status-labels";
import { getAuctionsCreatedByUser } from "@/services/auctions";
import { getTendersCreatedByUser } from "@/services/tenders";
import { getMyDirectListings, getBuyerOrders, getSellerOrders } from "@/services/direct";
import { getOffersByUser } from "@/services/offers";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";
import type { Auction, Tender } from "@/types";
import type { DirectOrder } from "@/services/direct";
import type { UserOffer } from "@/services/offers";
import type { MarketplaceListing } from "@/types";

type TabId = "tenders" | "auctions" | "listings" | "buyerOrders" | "sellerOrders" | "offers";

const TABS: { id: TabId; labelKey: string }[] = [
  { id: "tenders", labelKey: "account.activityTabs.tenders" },
  { id: "auctions", labelKey: "account.activityTabs.auctions" },
  { id: "listings", labelKey: "account.activityTabs.listings" },
  { id: "buyerOrders", labelKey: "account.activityTabs.buyerOrders" },
  { id: "sellerOrders", labelKey: "account.activityTabs.sellerOrders" },
  { id: "offers", labelKey: "account.activityTabs.offers" },
];

function displayTitle(
  marketTitle: ReturnType<typeof useLocalizedLabel>["marketTitle"],
  item: Auction | Tender | MarketplaceListing,
  kind: "auction" | "tender" | "direct",
  id: number | string,
  fallbackKey: string,
  t: ReturnType<typeof useI18n>["t"],
) {
  const fromHook = marketTitle(item as unknown as LocalizableRecord, kind);
  const idStr = String(id);
  if (fromHook && fromHook !== idStr) return fromHook;
  return t(fallbackKey, "", { id });
}

export function MyActivityContent() {
  const searchParams = useSearchParams();
  const { user, requireAuth } = useAuth();
  const { t, language } = useI18n();
  const { marketTitle } = useLocalizedLabel();
  const initial = (searchParams.get("tab") as TabId) || "tenders";
  const [tab, setTab] = useState<TabId>(
    TABS.some((item) => item.id === initial) ? initial : "tenders",
  );
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<DirectOrder[]>([]);
  const [sellerOrders, setSellerOrders] = useState<DirectOrder[]>([]);
  const [offers, setOffers] = useState<UserOffer[]>([]);

  useEffect(() => {
    if (!requireAuth() || !user?.userId) return;
    setLoading(true);
    const uid = user.userId;
    Promise.all([
      getTendersCreatedByUser(uid).catch(() => []),
      getAuctionsCreatedByUser(uid).catch(() => []),
      getMyDirectListings(uid).catch(() => []),
      getBuyerOrders(uid).catch(() => []),
      getSellerOrders(uid).catch(() => []),
      getOffersByUser(uid).catch(() => []),
    ])
      .then(([tenderItems, auctionItems, listingItems, bo, so, of]) => {
        setTenders(tenderItems);
        setAuctions(auctionItems);
        setListings(listingItems);
        setBuyerOrders(bo);
        setSellerOrders(so);
        setOffers(of);
      })
      .finally(() => setLoading(false));
  }, [requireAuth, user?.userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id ? "bg-emerald-600 text-white" : "border bg-white text-slate-700"
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      <ul className="space-y-3">
        {tab === "tenders" &&
          (tenders.length ? (
            tenders.map((tenderItem) => (
              <li key={tenderItem.tenderId}>
                <Link
                  href={`/tenders/${tenderItem.tenderId}`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">
                      {displayTitle(
                        marketTitle,
                        tenderItem,
                        "tender",
                        tenderItem.tenderId,
                        "market.tenderFallback",
                        t,
                      )}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        tenderItem.quantity != null
                          ? `${tenderItem.quantity} ${tenderItem.unit || ""}`
                          : null,
                        tenderItem.maxBudget != null
                          ? t("account.budgetLabel", "", {
                              amount: formatCurrencyLocalized(tenderItem.maxBudget, language),
                            })
                          : null,
                        getTenderLocation(tenderItem),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={tenderItem.status} />
                </Link>
              </li>
            ))
          ) : (
            <Empty hint={t("account.emptyTenders")} href="/tenders/create" label={t("account.createTender")} />
          ))}

        {tab === "auctions" &&
          (auctions.length ? (
            auctions.map((auctionItem) => (
              <li key={auctionItem.auctionId}>
                <Link
                  href={`/auctions/${auctionItem.auctionId}`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">
                      {displayTitle(
                        marketTitle,
                        auctionItem,
                        "auction",
                        auctionItem.auctionId,
                        "market.auctionFallback",
                        t,
                      )}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        auctionItem.cropQuantity != null
                          ? `${auctionItem.cropQuantity} ${auctionItem.cropUnit || ""}`
                          : null,
                        auctionItem.currentPrice != null
                          ? t("account.priceLabel", "", {
                              amount: formatCurrencyLocalized(auctionItem.currentPrice, language),
                            })
                          : null,
                        getAuctionLocation(auctionItem),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={auctionItem.status} />
                </Link>
              </li>
            ))
          ) : (
            <Empty hint={t("account.emptyAuctions")} href="/auctions/create" label={t("account.createAuction")} />
          ))}

        {tab === "listings" &&
          (listings.length ? (
            listings.map((listingItem) => (
              <li key={listingItem.listingId}>
                <Link
                  href={`/direct/${listingItem.listingId}/buy`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">
                      {displayTitle(
                        marketTitle,
                        listingItem,
                        "direct",
                        listingItem.listingId,
                        "market.directFallback",
                        t,
                      )}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        listingItem.availableQty != null
                          ? t("account.availableLabel", "", {
                              qty: listingItem.availableQty,
                              unit: listingItem.unit || "",
                            })
                          : null,
                        getListingLocation(listingItem),
                        translateStatus(listingItem.status, t),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {t("account.unitPriceLabel", "", {
                      price: formatCurrencyLocalized(listingItem.unitPrice ?? 0, language),
                    })}
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <Empty hint={t("account.emptyListings")} href="/direct/new" label={t("account.newListing")} />
          ))}

        {tab === "buyerOrders" &&
          (buyerOrders.length ? (
            buyerOrders.map((orderItem) => (
              <li key={orderItem.orderId ?? orderItem.id}>
                <Link
                  href={`/orders/direct/${orderItem.orderId ?? orderItem.id}`}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-emerald-200"
                >
                  <span className="font-medium">
                    {orderItem.listingTitle ||
                      orderItem.cropName ||
                      t("account.orderFallback", "", { id: orderItem.orderId ?? orderItem.id ?? "" })}
                  </span>
                  <StatusBadge status={orderItem.status} />
                </Link>
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-slate-500">{t("account.emptyBuyerOrders")}</li>
          ))}

        {tab === "sellerOrders" &&
          (sellerOrders.length ? (
            sellerOrders.map((orderItem) => (
              <li key={orderItem.orderId ?? orderItem.id}>
                <Link
                  href={`/orders/direct/${orderItem.orderId ?? orderItem.id}`}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-emerald-200"
                >
                  <span className="font-medium">
                    {orderItem.listingTitle ||
                      orderItem.cropName ||
                      t("account.orderFallback", "", { id: orderItem.orderId ?? orderItem.id ?? "" })}
                  </span>
                  <StatusBadge status={orderItem.status} />
                </Link>
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-slate-500">{t("account.emptySellerOrders")}</li>
          ))}

        {tab === "offers" &&
          (offers.length ? (
            offers.map((offerItem, i) => (
              <li key={offerItem.offerId ?? i}>
                <Link
                  href={offerItem.tenderId ? `/tenders/${offerItem.tenderId}` : "/tenders"}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-emerald-200"
                >
                  <span className="font-medium">
                    {offerItem.tenderTitle ||
                      offerItem.cropName ||
                      t("account.offerFallback", "", { id: offerItem.offerId ?? i })}
                  </span>
                  <span className="text-sm">
                    {formatCurrencyLocalized(offerItem.price ?? 0, language)} ·{" "}
                    <StatusBadge status={offerItem.status} />
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-slate-500">{t("account.emptyOffers")}</li>
          ))}
      </ul>
    </>
  );
}

function Empty({
  hint,
  href,
  label,
}: {
  hint: string;
  href: string;
  label: string;
}) {
  return (
    <li className="py-12 text-center">
      <p className="text-slate-500">{hint}</p>
      <Link href={href} className="mt-2 inline-block font-semibold text-emerald-600 hover:underline">
        {label}
      </Link>
    </li>
  );
}
