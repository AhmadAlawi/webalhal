import type { Advertisement } from "@/types";

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length ? s : undefined;
}

function pickHexColor(value: unknown): string | undefined {
  const s = pickString(value);
  if (!s) return undefined;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;
  return undefined;
}

function isAdLike(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  return o.advertisementId != null || o.AdvertisementId != null;
}

/** يستخرج مصفوفة إعلانات من غلاف API */
export function extractAdvertisements(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.items)) return p.items;

  const data = p.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    if (Array.isArray(inner.items)) return inner.items;
    if (isAdLike(data)) return [data];
  }
  if (isAdLike(payload)) return [payload];
  return [];
}

export function normalizeAdvertisement(raw: unknown): Advertisement {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = Number(r.advertisementId ?? r.AdvertisementId ?? 0);
  const navRaw = String(r.navigationType ?? r.NavigationType ?? "internal_route");
  const navigationType =
    navRaw === "external_link" ? "external_link" : "internal_route";

  return {
    advertisementId: Number.isFinite(id) ? id : 0,
    title: pickString(r.title ?? r.Title),
    description: pickString(r.description ?? r.Description) ?? null,
    imageUrl: pickString(r.imageUrl ?? r.ImageUrl),
    thumbnailUrl: pickString(r.thumbnailUrl ?? r.ThumbnailUrl) ?? null,
    linkUrl: pickString(r.linkUrl ?? r.LinkUrl),
    navigationType,
    navigationValue: pickString(r.navigationValue ?? r.NavigationValue),
    displayOrder: Number(r.displayOrder ?? r.DisplayOrder ?? 0),
    buttonLabel: pickString(r.buttonLabel ?? r.ButtonLabel),
    titleColor: pickHexColor(r.titleColor ?? r.TitleColor),
    subtitleColor:
      pickHexColor(r.subtitleColor ?? r.SubtitleColor) ??
      pickHexColor(r.descriptionColor ?? r.DescriptionColor),
    ctaBackgroundColor:
      pickHexColor(r.ctaBackgroundColor ?? r.CtaBackgroundColor) ??
      pickHexColor(r.buttonBackgroundColor ?? r.ButtonBackgroundColor),
    ctaTextColor:
      pickHexColor(r.ctaTextColor ?? r.CtaTextColor) ??
      pickHexColor(r.buttonTextColor ?? r.ButtonTextColor),
    isEnabled: Boolean(r.isEnabled ?? r.IsEnabled ?? true),
  };
}

export function sortAdvertisements(ads: Advertisement[]): Advertisement[] {
  return [...ads]
    .filter((a) => a.advertisementId > 0 && a.isEnabled !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

/** مسار التنقل من إعدادات الإعلان */
export function advertisementHref(ad: Advertisement): string | null {
  if (ad.linkUrl) return ad.linkUrl;
  const nav = ad.navigationValue?.trim();
  if (!nav) return null;

  if (ad.navigationType === "external_link") {
    return nav.startsWith("http") ? nav : `https://${nav}`;
  }

  const categoryMatch = nav.match(/^\/category\/(\d+)$/i);
  if (categoryMatch) return `/?categoryId=${categoryMatch[1]}`;

  return nav.startsWith("/") ? nav : `/${nav}`;
}

export function isExternalAdHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
