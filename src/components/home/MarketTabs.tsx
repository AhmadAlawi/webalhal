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
    <div className="inline-flex w-full flex-row-reverse gap-1 rounded-full bg-[#E9EAEC] p-1.5 shadow-[0_12px_30px_rgba(0,6,109,0.08)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "min-w-0 flex-1 rounded-full px-4 py-3 text-base font-bold transition-colors",
            active === tab.id
              ? "bg-[#00066D] text-white shadow-lg shadow-[#00066D]/25"
              : "text-[#777B8F] hover:text-[#00066D]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
