"use client";

import Link from "next/link";
import { RefreshCw, BarChart2 } from "lucide-react";
import { clsx } from "clsx";
import type { ChartGroupBy } from "@/types/market-chart";
import type { FilterGovernorate, FilterProduct } from "@/types/market-chart";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const TIMEFRAMES: { id: ChartGroupBy; label: string }[] = [
  { id: "day", label: "يوم" },
  { id: "week", label: "أسبوع" },
  { id: "month", label: "شهر" },
];

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
  onProductChange: (id: number) => void;
  onGovernorateChange: (id: number) => void;
  onGroupByChange: (g: ChartGroupBy) => void;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onRetry?: () => void;
}) {
  const changeUp = (priceChange ?? 0) >= 0;

  return (
    <header className="border-b border-[#2a2e39] bg-[#1e222d] px-4 py-4 text-[#d1d4dc] lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-lg font-bold text-white">مخطط السوق — سعر الوحدة</h1>
              <p className="text-xs text-slate-400">ل.س / كغ — بيانات SalesTransactions</p>
            </div>
          </div>
          <Link
            href="/market-analysis/overview"
            className="text-sm text-emerald-400 hover:underline"
          >
            نظرة عامة على التحليلات
          </Link>
        </div>

        <div className="flex flex-wrap items-end gap-3" dir="rtl">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-slate-400">المنتج</span>
            <select
              className="min-w-[200px] rounded-lg border border-[#2a2e39] bg-[#2a2e39] px-3 py-2 text-sm text-white"
              value={productId ?? ""}
              onChange={(e) => onProductChange(Number(e.target.value))}
            >
              <option value="">اختر منتجاً</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameAr || p.name || `#${p.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-slate-400">المحافظة</span>
            <select
              className="min-w-[140px] rounded-lg border border-[#2a2e39] bg-[#2a2e39] px-3 py-2 text-sm text-white"
              value={governorate}
              onChange={(e) => onGovernorateChange(Number(e.target.value))}
            >
              <option value={0}>الكل</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr || g.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-lg border border-[#2a2e39] p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onGroupByChange(tf.id)}
                className={clsx(
                  "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
                  groupBy === tf.id
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {minDate && maxDate && (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-400">من</span>
                <input
                  type="date"
                  className="rounded-lg border border-[#2a2e39] bg-[#2a2e39] px-2 py-2 text-sm text-white"
                  value={startDate ?? minDate.slice(0, 10)}
                  min={minDate.slice(0, 10)}
                  max={endDate ?? maxDate.slice(0, 10)}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-400">إلى</span>
                <input
                  type="date"
                  className="rounded-lg border border-[#2a2e39] bg-[#2a2e39] px-2 py-2 text-sm text-white"
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
              className="flex items-center gap-2 rounded-lg border border-[#2a2e39] px-3 py-2 text-sm hover:bg-[#2a2e39] disabled:opacity-50"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
              تحديث
            </button>
          )}
        </div>

        {productId && (
          <div className="flex flex-wrap items-baseline gap-6 border-t border-[#2a2e39] pt-4">
            <div>
              <span className="text-sm text-slate-400">{productName || "—"}</span>
              <p className="text-2xl font-bold text-white">{formatCurrency(lastPrice)}</p>
              <span className="text-xs text-slate-500">ل.س / كغ</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">تغير السعر</span>
              <p
                className={clsx(
                  "text-lg font-semibold",
                  changeUp ? "text-emerald-400" : "text-red-400",
                )}
              >
                {formatPercent(priceChange)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">تغير الحجم</span>
              <p className="text-lg font-semibold text-slate-200">
                {formatPercent(volumeChange)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">التذبذب</span>
              <p className="text-lg font-semibold text-slate-200">
                {formatNumber(volatility)} ل.س/كغ
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
