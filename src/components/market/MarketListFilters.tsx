"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useI18n } from "@/context/I18nContext";
import {
  DEFAULT_PAGE_SIZE,
  type MarketListFilterState,
} from "@/lib/market-list-filters";

const SORT_OPTIONS = [
  { value: "", labelKey: "market.filters.sortDefault" },
  { value: "endTime", labelKey: "market.filters.sortEndTime" },
  { value: "startingPrice", labelKey: "market.filters.sortPrice" },
  { value: "createdAt", labelKey: "market.filters.sortCreatedAt" },
] as const;

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
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const currency = t("common.currency");

  const priceLabel =
    kind === "auctions"
      ? `${t("market.filters.startingPrice")} (${currency})`
      : kind === "tenders"
        ? `${t("market.filters.budget")} (${currency})`
        : `${t("market.filters.unitPrice")} (${currency})`;

  const searchPlaceholder =
    kind === "auctions"
      ? t("market.filters.searchAuctions")
      : kind === "tenders"
        ? t("market.filters.searchTenders")
        : t("market.filters.searchDirect");

  function patch(partial: Partial<MarketListFilterState>) {
    onFiltersChange({ ...filters, page: 1, ...partial });
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={searchPlaceholder}
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
          {t("market.filters.advanced")}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("market.filters.category")}</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.categoryId ?? ""}
              onChange={(e) =>
                patch({
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">{t("common.all")}</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {localized(c as unknown as LocalizableRecord)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">
              {priceLabel} — {t("market.filters.from")}
            </span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.minPrice ?? ""}
              onChange={(e) => patch({ minPrice: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">
              {priceLabel} — {t("market.filters.to")}
            </span>
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
                <span className="font-medium text-slate-600">{t("market.filters.startsAfter")}</span>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-gray-200 px-3 py-2"
                  value={filters.startTimeFrom ?? ""}
                  onChange={(e) => patch({ startTimeFrom: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-600">{t("market.filters.endsBefore")}</span>
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
            <span className="font-medium text-slate-600">{t("market.filters.sortBy")}</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.sortBy ?? ""}
              onChange={(e) => patch({ sortBy: e.target.value || undefined })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value || "default"} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("market.filters.sortOrder")}</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={filters.sortOrder ?? "desc"}
              onChange={(e) =>
                patch({ sortOrder: (e.target.value as "asc" | "desc") || "desc" })
              }
            >
              <option value="desc">{t("market.filters.sortDesc")}</option>
              <option value="asc">{t("market.filters.sortAsc")}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("market.filters.resultCount")}</span>
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
              {t("market.filters.reset")}
            </button>
            {filters.page != null && filters.page > 1 && (
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                onClick={() => patch({ page: (filters.page ?? 2) - 1 })}
              >
                {t("common.previous")}
              </button>
            )}
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
            >
              {t("market.filters.nextPage")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
