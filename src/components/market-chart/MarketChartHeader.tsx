"use client";

import Link from "next/link";
import { RefreshCw, BarChart2 } from "lucide-react";
import { clsx } from "clsx";
import type { ChartGroupBy } from "@/types/market-chart";
import type { FilterGovernorate, FilterProduct } from "@/types/market-chart";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";

const TIMEFRAME_IDS: ChartGroupBy[] = ["day", "week", "month"];

export function MarketChartHeader({
  products,
  governorates,
  productId,
  governorate,
  groupBy,
  startDate,
  endDate,
  minDate,
  maxDate,
  productName,
  lastPrice,
  priceChange,
  volumeChange,
  volatility,
  loading,
  onProductChange,
  onGovernorateChange,
  onGroupByChange,
  onStartDateChange,
  onEndDateChange,
  onRetry,
}: {
  products: FilterProduct[];
  governorates: FilterGovernorate[];
  productId?: number;
  governorate: number;
  groupBy: ChartGroupBy;
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  productName?: string;
  lastPrice?: number;
  priceChange?: number;
  volumeChange?: number;
  volatility?: number;
  loading?: boolean;
  onProductChange: (id: number | undefined) => void;
  onGovernorateChange: (id: number) => void;
  onGroupByChange: (g: ChartGroupBy) => void;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onRetry?: () => void;
}) {
  const { t, direction } = useI18n();
  const { localized } = useLocalizedLabel();
  const changeUp = (priceChange ?? 0) >= 0;

  const selectedProduct = products.find((p) => p.productId === productId);
  const displayProductName =
    (selectedProduct ? localized(selectedProduct, "name") : "") ||
    productName ||
    "—";

  return (
    <header className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">{t("marketChart.title")}</h1>
              <p className="text-xs text-slate-500">{t("marketChart.subtitle")}</p>
            </div>
          </div>
          <Link
            href="/market-analysis/overview"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            {t("marketChart.overviewLink")}
          </Link>
        </div>

        <div className="flex flex-wrap items-end gap-3" dir={direction}>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">{t("marketChart.product")}</span>
            <select
              className="min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={productId ?? ""}
              onChange={(e) =>
                onProductChange(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">{t("marketChart.selectProduct")}</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {localized(p, "name", `#${p.productId}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">{t("marketChart.governorate")}</span>
            <select
              className="min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={governorate}
              onChange={(e) => onGovernorateChange(Number(e.target.value))}
            >
              <option value={0}>{t("common.all")}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {localized(g, "name")}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-lg border border-gray-200 p-0.5">
            {TIMEFRAME_IDS.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onGroupByChange(tf)}
                className={clsx(
                  "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
                  groupBy === tf
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                {t(`marketChart.timeframes.${tf}`)}
              </button>
            ))}
          </div>

          {minDate && maxDate && (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-slate-600">{t("marketChart.from")}</span>
                <input
                  type="date"
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  value={startDate ?? minDate.slice(0, 10)}
                  min={minDate.slice(0, 10)}
                  max={endDate ?? maxDate.slice(0, 10)}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-slate-600">{t("marketChart.to")}</span>
                <input
                  type="date"
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  value={endDate ?? maxDate.slice(0, 10)}
                  min={startDate ?? minDate.slice(0, 10)}
                  max={maxDate.slice(0, 10)}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </label>
            </>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
              {t("marketChart.refresh")}
            </button>
          )}
        </div>

        {productId && (
          <div className="flex flex-wrap items-baseline gap-6 border-t border-slate-200 pt-4">
            <div>
              <span className="text-sm text-slate-500">{displayProductName}</span>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(lastPrice)}</p>
              <span className="text-xs text-slate-500">{t("marketChart.unitPerKg")}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">{t("marketChart.priceChange")}</span>
              <p
                className={clsx(
                  "text-lg font-semibold",
                  changeUp ? "text-emerald-600" : "text-red-500",
                )}
              >
                {formatPercent(priceChange)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">{t("marketChart.volumeChange")}</span>
              <p className="text-lg font-semibold text-slate-700">
                {formatPercent(volumeChange)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">{t("marketChart.volatility")}</span>
              <p className="text-lg font-semibold text-slate-700">
                {formatNumber(volatility)} {t("marketChart.volatilityUnit")}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
