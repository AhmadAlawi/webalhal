import { getApiBaseUrl } from "./config";

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "/placeholder-crop.svg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiBaseUrl().replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

function pickFirstUrl(...candidates: (string | undefined | null)[]): string | undefined {
  for (const c of candidates) {
    if (c?.trim()) return c.trim();
  }
  return undefined;
}

function urlsFromRecord(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.imageUrls)) return r.imageUrls.filter((u): u is string => typeof u === "string");
  if (Array.isArray(r.ImageUrls)) return r.ImageUrls.filter((u): u is string => typeof u === "string");
  if (Array.isArray(r.images)) {
    return (r.images as { url?: string; imageUrl?: string }[])
      .map((img) => img.url ?? img.imageUrl)
      .filter((u): u is string => Boolean(u));
  }
  return [];
}

/** صور المحصول/العرض أولاً — تجنب صورة المنتج الافتراضية من لوحة التحكم */
export function getAuctionMainImage(auction: {
  productMainImage?: string;
  productImageUrl?: string;
  images?: string[];
  imageUrls?: string[];
  cropImageUrls?: string[];
  crop?: { imageUrls?: string[] };
}): string {
  const cropUrls = auction.cropImageUrls ?? urlsFromRecord(auction.crop);
  const userUrl = pickFirstUrl(
    cropUrls?.[0],
    auction.imageUrls?.[0],
    auction.images?.[0],
  );
  if (userUrl) return resolveMediaUrl(userUrl);
  return resolveMediaUrl(auction.productImageUrl ?? auction.productMainImage);
}

export function getDirectMainImage(listing: {
  productImageUrl?: string;
  productMainImage?: string;
  imageUrls?: string[];
}): string {
  const userUrl = pickFirstUrl(listing.imageUrls?.[0]);
  if (userUrl) return resolveMediaUrl(userUrl);
  return resolveMediaUrl(listing.productImageUrl ?? listing.productMainImage);
}

export function getTenderMainImage(tender: {
  productImageUrl?: string;
  productMainImage?: string;
  imageUrls?: string[];
}): string {
  return getDirectMainImage(tender);
}
