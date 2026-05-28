"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { KpiCard } from "@/types/market-analysis";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const KPI_TITLE_AR: Record<string, string> = {
  totalrevenue: "إجمالي الإيرادات",
  totalvolume: "إجمالي الحجم",
  totaltransactions: "إجمالي العمليات",
  averageprice: "متوسط السعر",
  activeproducts: "المنتجات النشطة",
  topgovernorate: "أعلى محافظة",
};

function translateKpiTitle(title?: string): string {
  if (!title) return "—";
  const key = title.toLowerCase().replace(/[\s_-]/g, "");
  return KPI_TITLE_AR[key] ?? title;
}

export function KpiCardView({ kpi, isCurrency }: { kpi?: KpiCard; isCurrency?: boolean }) {
  if (!kpi) return null;

  const display =
    isCurrency || kpi.unit === "SYP" || kpi.unit === "ل.س"
      ? formatCurrency(kpi.value)
      : `${formatNumber(kpi.value)}${kpi.unit ? ` ${kpi.unit}` : ""}`;

  const TrendIcon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;

  return (
    <article className="card card-hover p-5">
      <p className="text-sm font-medium text-slate-500">{translateKpiTitle(kpi.title)}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{display}</p>
      {kpi.changePercentage != null && (
        <p
          className={clsx(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            kpi.trend === "up" && "text-emerald-600",
            kpi.trend === "down" && "text-red-600",
            kpi.trend === "stable" && "text-slate-500",
            !kpi.trend && "text-slate-500",
          )}
        >
          <TrendIcon className="h-4 w-4" />
          {formatPercent(kpi.changePercentage)}
          {kpi.comparisonPeriod && (
            <span className="font-normal text-slate-400">· {kpi.comparisonPeriod}</span>
          )}
        </p>
      )}
    </article>
  );
}
