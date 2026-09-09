import type { AppLanguage } from "@/context/I18nContext";

export type LocalizableRecord = Record<string, unknown> | object | null | undefined;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pickFirst(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) return candidate.trim();
  }
  return undefined;
}

function readField(item: Record<string, unknown>, key: string): unknown {
  if (key in item) return item[key];
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  if (pascal in item) return item[pascal];
  return undefined;
}

function localizedFieldKeys(field: string, language: AppLanguage): string[] {
  const other = language === "ar" ? "en" : "ar";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return [
    `${field}_${language}`,
    `${field}${cap(language)}`,
    `${field}_${other}`,
    `${field}${cap(other)}`,
    field,
  ];
}

/**
 * Picks the best localized string from API objects.
 * Supports flat fields (nameAr/nameEn), snake_case, nested { ar, en }, and common API aliases.
 */
export function getLocalizedValue(
  item: LocalizableRecord,
  field = "name",
  language: AppLanguage = "en",
  fallback = "",
): string {
  if (!item || typeof item !== "object") return fallback;

  const record = item as Record<string, unknown>;
  const nested = readField(record, field);
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const obj = nested as Record<string, unknown>;
    const fromNested = pickFirst(
      obj[language],
      obj[language === "ar" ? "nameAr" : "nameEn"],
      obj.en,
      obj.ar,
      obj.name,
    );
    if (fromNested) return fromNested;
  }

  const candidates: unknown[] = [];

  for (const key of localizedFieldKeys(field, language)) {
    candidates.push(readField(record, key));
  }

  if (field === "name" || field === "productName") {
    candidates.push(
      readField(record, language === "ar" ? "productNameAr" : "productNameEn"),
      readField(record, "productNameAr"),
      readField(record, "productNameEn"),
      readField(record, "cropName"),
      readField(record, "auctionTitle"),
      readField(record, "title"),
      readField(record, "categoryNameAr"),
      readField(record, "categoryNameEn"),
      readField(record, "governorateNameAr"),
      readField(record, "governorateNameEn"),
      readField(record, "governorateName"),
      readField(record, "cityName"),
    );
  }

  for (const value of Object.values(record)) {
    if (isNonEmptyString(value)) candidates.push(value);
  }

  return pickFirst(...candidates) ?? fallback;
}

export function getLocationLabel(
  item: LocalizableRecord,
  language: AppLanguage,
  fallback = "",
): string {
  return getLocalizedValue(item, "name", language, fallback);
}

export function getMarketItemTitle(
  item: LocalizableRecord,
  language: AppLanguage,
  kind: "auction" | "tender" | "direct",
  id?: number | string,
): string {
  const record = (item ?? {}) as Record<string, unknown>;
  const resolvedId =
    id ??
    record.auctionId ??
    record.tenderId ??
    record.listingId ??
    record.id;

  const title = pickFirst(
    getLocalizedValue(record, "title", language),
    getLocalizedValue(record, "name", language),
    getLocalizedValue(record, "productName", language),
    readField(record, "cropName"),
    readField(record, "auctionTitle"),
  );

  if (title) return title;
  if (resolvedId != null) return String(resolvedId);
  return "";
}
