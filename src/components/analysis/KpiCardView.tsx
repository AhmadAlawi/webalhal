"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { KpiCard } from "@/types/market-analysis";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export function KpiCardView({ kpi, isCurrency }: { kpi?: KpiCard; isCurrency?: boolean }) {
  if (!kpi) return null;

  const display =
    isCurrency || kpi.unit === "SYP" || kpi.unit === "ل.س"
      ? formatCurrency(kpi.value)
      : `${formatNumber(kpi.value)}${kpi.unit ? ` ${kpi.unit}` : ""}`;

  const TrendIcon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">{kpi.title ?? "—"}</p>
      <motion.p
        key={display}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-2xl font-bold text-slate-900"
      >
        {display}
      </motion.p>
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
            <span className="text-slate-400 font-normal">· {kpi.comparisonPeriod}</span>
          )}
        </p>
      )}
    </motion.article>
  );
}
