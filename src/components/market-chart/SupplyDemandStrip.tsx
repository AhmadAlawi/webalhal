"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MultiSeriesTimeData } from "@/types/market-chart";
import { formatDateAr, formatNumber } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";
import { useTheme } from "@/context/ThemeContext";
import {
  CHART_TICK_DARK,
  CHART_TICK_LIGHT,
  getChartGrid,
  getChartTooltipStyle,
} from "@/components/analysis/charts/chartTheme";

export function SupplyDemandStrip({ data }: { data: MultiSeriesTimeData }) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const grid = getChartGrid(isDark);
  const tooltipStyle = getChartTooltipStyle(isDark);
  const tick = isDark ? CHART_TICK_DARK : CHART_TICK_LIGHT;
  const dates = new Set<string>();
  for (const p of data.supply) dates.add(p.date.slice(0, 10));
  for (const p of data.demand) dates.add(p.date.slice(0, 10));
  const sorted = [...dates].sort();
  const supplyMap = new Map(data.supply.map((p) => [p.date.slice(0, 10), p.value]));
  const demandMap = new Map(data.demand.map((p) => [p.date.slice(0, 10), p.value]));

  if (!sorted.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        {t("marketChart.supplyDemand.empty")}
      </p>
    );
  }

  const show = sorted.length > 21 ? sorted.slice(-21) : sorted;
  const chartData = show.map((date) => {
    const supply = supplyMap.get(date) ?? 0;
    const demand = demandMap.get(date) ?? 0;
    const total = supply + demand || 1;
    return {
      date,
      label: formatDateAr(date),
      supply,
      demand,
      buyPressure: Math.round((demand / total) * 100),
    };
  });

  const seriesLabel = (name: string) =>
    name === "supply"
      ? t("marketChart.supplyDemand.supply")
      : t("marketChart.supplyDemand.demand");

  return (
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, ...tick }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, ...tick }} width={40} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, name) => [
              `${formatNumber(Number(v))} ${t("marketChart.supplyDemand.kg")}`,
              seriesLabel(String(name)),
            ]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { buyPressure?: number } | undefined;
              return row?.buyPressure != null
                ? t("marketChart.supplyDemand.buyPressure", "", { percent: row.buyPressure })
                : "";
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: tick.fill }}
            formatter={(v) => seriesLabel(String(v))}
          />
          <Bar
            dataKey="supply"
            fill="#10b981"
            radius={[2, 2, 0, 0]}
            animationDuration={700}
          />
          <Bar
            dataKey="demand"
            fill="#ef5350"
            radius={[2, 2, 0, 0]}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
