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
    kind === "auctions" ? "سعر البداية (ل.س)" : kind === "tenders" ? "الميزانية (ل.س)" : "سعر الوحدة (ل.س)";

  function patch(partial: Partial<MarketListFilterState>) {
    onFiltersChange({ ...filters, page: 1, ...partial });
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلاتر متقدمة
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">التصنيف</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
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
            <span className="font-medium text-slate-600">{priceLabel} — من</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.minPrice ?? ""}
              onChange={(e) => patch({ minPrice: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{priceLabel} — إلى</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.maxPrice ?? ""}
              onChange={(e) => patch({ maxPrice: e.target.value })}
            />
          </label>

          {(kind === "auctions" || kind === "tenders") && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-600">يبدأ بعد</span>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-gray-200 px-3 py-2"
                  value={filters.startTimeFrom ?? ""}
                  onChange={(e) => patch({ startTimeFrom: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-600">ينتهي قبل</span>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-gray-200 px-3 py-2"
                  value={filters.endTimeTo ?? ""}
                  onChange={(e) => patch({ endTimeTo: e.target.value })}
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">ترتيب حسب</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
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
            <span className="font-medium text-slate-600">اتجاه الترتيب</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
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
            <span className="font-medium text-slate-600">عدد النتائج</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
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

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() =>
                onFiltersChange({ page: 1, pageSize: DEFAULT_PAGE_SIZE, sortOrder: "desc" })
              }
            >
              إعادة تعيين
            </button>
            {filters.page != null && filters.page > 1 && (
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                onClick={() => patch({ page: (filters.page ?? 2) - 1 })}
              >
                السابق
              </button>
            )}
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
