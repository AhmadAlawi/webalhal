"use client";

import { formatPrice } from "@/lib/auctionPricing";
import type { Bid } from "@/types";

export function AuctionBiddersList({
  bids,
  title = "قائمة المزايدين",
  maxHeight = "min(70vh, 640px)",
  className = "",
}: {
  bids: Bid[];
  title?: string;
  maxHeight?: string;
  className?: string;
}) {
  return (
    <aside
      className={`flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24 ${className}`}
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{bids.length} مزايدة</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight }}>
        {bids.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">لا توجد مزايدات بعد</p>
        ) : (
          <ul className="space-y-2">
            {bids.map((b, i) => (
              <li
                key={b.bidId ?? i}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-slate-800">
                  {i === 0 && (
                    <span className="ml-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      الأعلى
                    </span>
                  )}
                  {b.bidderName || "مزايد"}
                </span>
                <span className="shrink-0 font-bold text-emerald-700">
                  {formatPrice(b.bidAmount)} ل.س
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
