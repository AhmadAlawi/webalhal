"use client";

import { clsx } from "clsx";

export type MarketTab = "auctions" | "tenders" | "direct";

const TABS: { id: MarketTab; label: string }[] = [
  { id: "auctions", label: "المزادات" },
  { id: "tenders", label: "المناقصات" },
  { id: "direct", label: "البيع المباشر" },
];

export function MarketTabs({
  active,
  onChange,
}: {
  active: MarketTab;
  onChange: (tab: MarketTab) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-slate-50 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
            active === tab.id
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
