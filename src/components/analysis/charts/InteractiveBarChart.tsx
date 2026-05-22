"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { CHART_COLORS, CHART_GRID, CHART_TOOLTIP_STYLE } from "./chartTheme";
import { formatNumber } from "@/lib/format";

export interface BarChartItem {
  label: string;
  value: number;
}

export function InteractiveBarChart({
  items,
  valueFormatter = formatNumber,
  horizontal,
  height = horizontal ? Math.max(220, items.length * 44) : 260,
}: {
  items: BarChartItem[];
  valueFormatter?: (n: number) => string;
  horizontal?: boolean;
  height?: number;
}) {
  if (!items.length) {
    return <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>;
  }

  const data = items.map((i) => ({ name: i.label, value: i.value }));

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            formatter={(v) => [valueFormatter(Number(v)), "القيمة"]}
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ fill: "rgba(5,150,105,0.08)" }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800} animationEasing="ease-out">
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={56} />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} width={48} />
        <Tooltip
          formatter={(v) => [valueFormatter(Number(v)), "القيمة"]}
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={{ fill: "rgba(5,150,105,0.06)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
