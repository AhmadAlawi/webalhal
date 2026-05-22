"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_GRID, CHART_TOOLTIP_STYLE } from "./chartTheme";
import { formatCurrency, formatNumber } from "@/lib/format";

export interface AreaChartPoint {
  label: string;
  value: number;
}

export function InteractiveAreaChart({
  points,
  isCurrency,
  height = 280,
  color = "#059669",
}: {
  points: AreaChartPoint[];
  isCurrency?: boolean;
  height?: number;
  color?: string;
}) {
  if (!points.length) {
    return <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>;
  }

  const fmt = isCurrency ? formatCurrency : formatNumber;
  const data = points.map((p) => ({ name: p.label, value: p.value }));
  const gradId = "areaGrad";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} width={64} />
        <Tooltip
          formatter={(v) => [fmt(Number(v)), isCurrency ? "السعر" : "القيمة"]}
          contentStyle={CHART_TOOLTIP_STYLE}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
