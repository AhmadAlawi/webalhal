"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/lib/auctionPricing";
import { getAuctionLocation, getListingLocation, getTenderLocation } from "@/lib/marketplace";
import { getAuctionsCreatedByUser } from "@/services/auctions";
import { getTendersCreatedByUser } from "@/services/tenders";
import { getMyDirectListings, getBuyerOrders } from "@/services/direct";
import { getOffersByUser } from "@/services/offers";
import { useAuth } from "@/context/AuthContext";
import type { Auction, Tender } from "@/types";
import type { DirectOrder } from "@/services/direct";
import type { UserOffer } from "@/services/offers";
import type { MarketplaceListing } from "@/types";

type TabId = "tenders" | "auctions" | "listings" | "buyerOrders" | "offers";

const TABS: { id: TabId; label: string }[] = [
  { id: "tenders", label: "مناقصاتي" },
  { id: "auctions", label: "مزاداتي" },
  { id: "listings", label: "عروض البيع" },
  { id: "buyerOrders", label: "طلبات شراء" },
  { id: "offers", label: "عروضي على مناقصات" },
];

export function MyActivityContent() {
  const searchParams = useSearchParams();
  const { user, requireAuth } = useAuth();
  const initial = (searchParams.get("tab") as TabId) || "tenders";
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initial) ? initial : "tenders",
  );
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<DirectOrder[]>([]);
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
      getOffersByUser(uid).catch(() => []),
    ])
      .then(([t, a, l, o, of]) => {
        setTenders(t);
        setAuctions(a);
        setListings(l);
        setBuyerOrders(o);
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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-emerald-600 text-white" : "border bg-white text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <ul className="space-y-3">
        {tab === "tenders" &&
          (tenders.length ? (
            tenders.map((t) => (
              <li key={t.tenderId}>
                <Link
                  href={`/tenders/${t.tenderId}`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{t.title || t.cropName}</span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        t.quantity != null ? `${t.quantity} ${t.unit || ""}` : null,
                        t.maxBudget != null ? `ميزانية ${formatPrice(t.maxBudget)} ل.س` : null,
                        getTenderLocation(t),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))
          ) : (
            <Empty hint="لم تنشئ مناقصات" href="/tenders/create" label="إنشاء مناقصة" />
          ))}

        {tab === "auctions" &&
          (auctions.length ? (
            auctions.map((a) => (
              <li key={a.auctionId}>
                <Link
                  href={`/auctions/${a.auctionId}`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{a.auctionTitle || a.cropName}</span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        a.cropQuantity != null ? `${a.cropQuantity} ${a.cropUnit || ""}` : null,
                        a.currentPrice != null ? `السعر ${formatPrice(a.currentPrice)} ل.س` : null,
                        getAuctionLocation(a),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))
          ) : (
            <Empty hint="لم تنشئ مزادات" href="/auctions/create" label="إنشاء مزاد" />
          ))}

        {tab === "listings" &&
          (listings.length ? (
            listings.map((l) => (
              <li key={l.listingId}>
                <Link
                  href={`/direct/${l.listingId}/buy`}
                  className="flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{l.title || l.cropName}</span>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        l.availableQty != null ? `متاح ${l.availableQty} ${l.unit || ""}` : null,
                        getListingLocation(l),
                        l.status,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {formatPrice(l.unitPrice ?? 0)} ل.س / وحدة
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <Empty hint="لا عروض بيع" href="/direct/new" label="عرض جديد" />
          ))}

        {tab === "buyerOrders" &&
          (buyerOrders.length ? (
            buyerOrders.map((o) => (
              <li key={o.orderId ?? o.id}>
                <Link
                  href={`/orders/direct/${o.orderId ?? o.id}`}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-emerald-200"
                >
                  <span className="font-medium">
                    {o.listingTitle || o.cropName || `طلب #${o.orderId}`}
                  </span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-slate-500">لا طلبات شراء</li>
          ))}

        {tab === "offers" &&
          (offers.length ? (
            offers.map((o, i) => (
              <li key={o.offerId ?? i}>
                <Link
                  href={o.tenderId ? `/tenders/${o.tenderId}` : "/tenders"}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-emerald-200"
                >
                  <span className="font-medium">
                    {o.tenderTitle || o.cropName || `عرض #${o.offerId}`}
                  </span>
                  <span className="text-sm">
                    {formatPrice(o.price ?? 0)} ل.س · <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-slate-500">لا عروض مقدّمة</li>
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
