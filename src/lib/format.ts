import type { AppLanguage } from "@/context/I18nContext";

function localeFor(language: AppLanguage = "ar"): string {
  return language === "ar" ? "ar-SY" : "en-US";
}

export function formatNumber(n?: number | null, language: AppLanguage = "ar"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: 0 }).format(n);
}

export function formatCurrency(n?: number | null, language: AppLanguage = "ar"): string {
  if (n == null || Number.isNaN(n)) return "—";
  const suffix = language === "ar" ? "ل.س" : "SYP";
  return `${formatNumber(n, language)} ${suffix}`;
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
