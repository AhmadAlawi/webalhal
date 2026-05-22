import { formatNumber } from "@/lib/format";

export interface BarItem {
  label: string;
  value: number;
}

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#047857", "#065f46"];

export function BarChartSimple({
  items,
  valueFormatter = formatNumber,
  horizontal,
}: {
  items: BarItem[];
  valueFormatter?: (n: number) => string;
  horizontal?: boolean;
}) {
  if (!items.length) {
    return <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  if (horizontal) {
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="max-w-[60%] truncate font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex h-48 items-end justify-between gap-2 pt-4">
      {items.map((item, i) => (
        <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div
            className="w-full max-h-full rounded-t-md"
            style={{
              height: `${Math.max(8, (item.value / max) * 100)}%`,
              backgroundColor: COLORS[i % COLORS.length],
            }}
            title={valueFormatter(item.value)}
          />
          <span className="max-w-full truncate text-center text-[10px] text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
