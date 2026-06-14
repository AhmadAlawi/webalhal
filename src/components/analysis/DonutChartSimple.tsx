"use client";

import { formatPercent } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";

const COLORS = ["#059669", "#0ea5e9", "#f59e0b", "#8b5cf6"];

export function DonutChartSimple({
  items,
}: {
  items: { label: string; value: number; percentage?: number }[];
}) {
  const { t } = useI18n();

  if (!items.length) {
    return <p className="py-8 text-center text-sm text-slate-400">{t("analysis.noData")}</p>;
  }

  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let cumulative = 0;
  const gradient = items
    .map((item, i) => {
      const pct = (item.value / total) * 100;
      const start = cumulative;
      cumulative += pct;
      return `${COLORS[i % COLORS.length]} ${start}% ${cumulative}%`;
    })
    .join(", ");

  const transactionTypeLabel = (key: string) => {
    const normalized = key.toLowerCase().trim();
    return t(`analysis.transactionTypes.${normalized}`, key);
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-center">
          <span className="text-xs font-medium text-slate-500">{t("analysis.byType")}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-slate-700">{transactionTypeLabel(item.label)}</span>
            <span className="text-slate-400">
              {item.percentage != null
                ? formatPercent(item.percentage)
                : `${Math.round((item.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
