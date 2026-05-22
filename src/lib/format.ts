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

/** تاريخ ثابت بين السيرفر والعميل — يتجنب اختلاف hydration من toLocaleDateString */
export function formatDateAr(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return iso;
  }
}
