"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "./chartTheme";
import { formatNumber, formatPercent } from "@/lib/format";

export interface PieChartItem {
  label: string;
  value: number;
  percentage?: number;
}

export function InteractivePieChart({ items }: { items: PieChartItem[] }) {
  const [active, setActive] = useState(0);

  if (!items.length) {
    return <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>;
  }

  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const data = items.map((i) => ({
    name: i.label,
    value: i.value,
    pct: i.percentage ?? (i.value / total) * 100,
  }));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="h-64 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={active >= 0 ? 88 : 88}
              paddingAngle={3}
              dataKey="value"
              animationDuration={700}
              onMouseEnter={(_, i) => setActive(i)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  stroke="none"
                  opacity={active === i ? 1 : 0.65}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, _n, p) => {
                const pct = (p?.payload as { pct?: number })?.pct;
                return [
                  `${formatNumber(Number(v))}${pct != null ? ` (${formatPercent(pct)})` : ""}`,
                  "الحصة",
                ];
              }}
              contentStyle={CHART_TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
        {data.map((d, i) => (
          <li key={d.name}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                active === i
                  ? "bg-emerald-50 text-emerald-800 scale-[1.02] shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full transition-transform"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  transform: active === i ? "scale(1.25)" : "scale(1)",
                }}
              />
              <span className="font-medium">{d.name}</span>
              <span className="text-slate-400">{formatPercent(d.pct)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
