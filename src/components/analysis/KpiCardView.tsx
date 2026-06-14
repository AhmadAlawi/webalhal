"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { KpiCard } from "@/types/market-analysis";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";

function translateKpiTitle(title: string | undefined, t: ReturnType<typeof useI18n>["t"]): string {
  if (!title) return "—";
  const key = title.toLowerCase().replace(/[\s_-]/g, "");
  return t(`analysis.kpi.${key}`, title);
}

export function KpiCardView({ kpi, isCurrency }: { kpi?: KpiCard; isCurrency?: boolean }) {
  const { t } = useI18n();

  if (!kpi) return null;

  const display =
    isCurrency || kpi.unit === "SYP" || kpi.unit === "ل.س"
      ? formatCurrency(kpi.value)
      : `${formatNumber(kpi.value)}${kpi.unit ? ` ${kpi.unit}` : ""}`;

  const TrendIcon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;

  return (
    <article className="card card-hover p-5">
      <p className="text-sm font-medium text-slate-500">{translateKpiTitle(kpi.title, t)}</p>
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
