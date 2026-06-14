import type { AppLanguage } from "@/context/I18nContext";

type TranslateFn = (key: string, fallback?: string) => string;

/** Maps API status codes to translated labels via i18n keys under `status.*`. */
export function translateStatus(
  status: string | null | undefined,
  t?: TranslateFn,
): string | null {
  if (!status?.trim()) return null;
  const key = status.toLowerCase().replace(/[\s_-]/g, "");
  if (t) return t(`status.${key}`, status);
  return status;
}

export function statusMetaLine(
  t: TranslateFn,
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .map((part) => {
      if (!part) return null;
      if (/^(open|active|closed|pending)$/i.test(part)) {
        return translateStatus(part, t);
      }
      return part;
    })
    .filter(Boolean)
    .join(" · ");
}

export function formatCurrencyLocalized(
  n: number | null | undefined,
  language: AppLanguage,
): string {
  if (n == null || Number.isNaN(n)) return "—";
  const locale = language === "ar" ? "ar-SY" : "en-US";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const suffix = language === "ar" ? "ل.س" : "SYP";
  return `${formatted} ${suffix}`;
}
