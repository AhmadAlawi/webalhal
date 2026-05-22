"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SparkPoint } from "@/types/market-analysis";
import { formatCurrency, formatNumber } from "@/lib/format";

export function MiniSparkline({
  points,
  isCurrency,
}: {
  points?: SparkPoint[];
  isCurrency?: boolean;
}) {
  if (!points?.length) {
    return (
      <div className="flex h-20 items-end gap-0.5 opacity-30">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-emerald-400" style={{ height: "20%" }} />
        ))}
      </div>
    );
  }

  const fmt = isCurrency ? formatCurrency : formatNumber;
  const data = points.map((p, i) => ({
    i,
    value: p.value ?? 0,
    label: p.date?.slice(0, 10) ?? String(i),
  }));

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          formatter={(v) => [fmt(Number(v)), "القيمة"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            direction: "rtl",
          }}
          labelFormatter={(_, p) => {
            const row = p?.[0]?.payload as { label?: string };
            return row?.label ?? "";
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#059669"
          strokeWidth={2}
          fill="url(#sparkGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#059669" }}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
