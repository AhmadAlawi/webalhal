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

const TOOLTIP = {
  backgroundColor: "#1e222d",
  border: "1px solid #2a2e39",
  borderRadius: "8px",
  color: "#d1d4dc",
  fontSize: "12px",
  direction: "rtl" as const,
};

export function SupplyDemandStrip({ data }: { data: MultiSeriesTimeData }) {
  const dates = new Set<string>();
  for (const p of data.supply) dates.add(p.date.slice(0, 10));
  for (const p of data.demand) dates.add(p.date.slice(0, 10));
  const sorted = [...dates].sort();
  const supplyMap = new Map(data.supply.map((p) => [p.date.slice(0, 10), p.value]));
  const demandMap = new Map(data.demand.map((p) => [p.date.slice(0, 10), p.value]));

  if (!sorted.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        لا توجد بيانات عرض/طلب في هذه الفترة
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

  return (
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
          <Tooltip
            contentStyle={TOOLTIP}
            formatter={(v, name) => [
              `${formatNumber(Number(v))} كغ`,
              name === "supply" ? "عرض / بيع" : "طلب / شراء",
            ]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { buyPressure?: number } | undefined;
              return row?.buyPressure != null ? `ضغط شراء: ${row.buyPressure}%` : "";
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
            formatter={(v) => (v === "supply" ? "عرض / بيع" : "طلب / شراء")}
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
