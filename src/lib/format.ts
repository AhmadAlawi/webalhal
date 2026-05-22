export function formatNumber(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 0 }).format(n);
}

export function formatCurrency(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${formatNumber(n)} ل.س`;
}

export function formatPercent(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function formatDateAr(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
