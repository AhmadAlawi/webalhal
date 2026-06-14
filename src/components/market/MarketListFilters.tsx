"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  DEFAULT_PAGE_SIZE,
  type MarketListFilterState,
} from "@/lib/market-list-filters";

const SORT_OPTIONS = [
  { value: "", label: "افتراضي" },
  { value: "endTime", label: "تاريخ الانتهاء" },
  { value: "startingPrice", label: "السعر" },
  { value: "createdAt", label: "الأحدث" },
];

export function MarketListFilters({
  kind,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
}: {
  kind: "auctions" | "tenders" | "direct";
  search: string;
  onSearchChange: (v: string) => void;
  filters: MarketListFilterState;
  onFiltersChange: (f: MarketListFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const priceLabel =
    kind === "auctions" ? "سعر البداية (JD)" : kind === "tenders" ? "الميزانية (JD)" : "سعر الوحدة (JD)";

  function patch(partial: Partial<MarketListFilterState>) {
    onFiltersChange({ ...filters, page: 1, ...partial });
  }

  return (
    <div className="mb-8 rounded-lg border border-[#D7D9E2] bg-white p-4 shadow-[0_12px_28px_rgba(0,6,109,0.06)] md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          placeholder={
            kind === "auctions"
              ? "بحث في المزادات..."
              : kind === "tenders"
                ? "بحث في المناقصات..."
                : "بحث في العروض..."
          }
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full flex-1 rounded-lg border border-[#D7D9E2] bg-[#F7F8FB] px-4 py-3.5 text-[#00066D] placeholder:text-[#8D90A0] focus:border-[#00066D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00066D]/15"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D7D9E2] bg-white px-4 py-3.5 text-sm font-bold text-[#00066D] hover:border-[#00066D]/30 hover:bg-[#F4F5FF]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلاتر متقدمة
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-[#D7D9E2] pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">التصنيف</span>
            <select
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.categoryId ?? ""}
              onChange={(e) =>
                patch({
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">الكل</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.nameAr || c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">{priceLabel} — من</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.minPrice ?? ""}
              onChange={(e) => patch({ minPrice: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">{priceLabel} — إلى</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.maxPrice ?? ""}
              onChange={(e) => patch({ maxPrice: e.target.value })}
            />
          </label>

          {(kind === "auctions" || kind === "tenders") && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-[#00066D]">يبدأ بعد</span>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
                  value={filters.startTimeFrom ?? ""}
                  onChange={(e) => patch({ startTimeFrom: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-[#00066D]">ينتهي قبل</span>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
                  value={filters.endTimeTo ?? ""}
                  onChange={(e) => patch({ endTimeTo: e.target.value })}
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">ترتيب حسب</span>
            <select
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.sortBy ?? ""}
              onChange={(e) => patch({ sortBy: e.target.value || undefined })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value || "default"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">اتجاه الترتيب</span>
            <select
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.sortOrder ?? "desc"}
              onChange={(e) =>
                patch({ sortOrder: (e.target.value as "asc" | "desc") || "desc" })
              }
            >
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#00066D]">عدد النتائج</span>
            <select
              className="rounded-lg border border-[#D7D9E2] px-3 py-2 text-[#00066D] focus:border-[#00066D] focus:outline-none"
              value={filters.pageSize ?? DEFAULT_PAGE_SIZE}
              onChange={(e) => patch({ pageSize: Number(e.target.value) })}
            >
              {[12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="button"
              className="rounded-lg border border-[#D7D9E2] px-4 py-2 text-sm font-bold text-[#777B8F] hover:bg-[#F7F8FB]"
              onClick={() =>
                onFiltersChange({ page: 1, pageSize: DEFAULT_PAGE_SIZE, sortOrder: "desc" })
              }
            >
              إعادة تعيين
            </button>
            {filters.page != null && filters.page > 1 && (
              <button
                type="button"
                className="rounded-lg border border-[#D7D9E2] px-4 py-2 text-sm font-bold text-[#00066D]"
                onClick={() => patch({ page: (filters.page ?? 2) - 1 })}
              >
                السابق
              </button>
            )}
            <button
              type="button"
              className="rounded-lg bg-[#00066D] px-4 py-2 text-sm font-bold text-white hover:bg-[#00044F]"
              onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
            >
              الصفحة التالية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
