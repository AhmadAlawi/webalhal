import { getApiBaseUrl } from "./config";

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "/placeholder-crop.svg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiBaseUrl().replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function getAuctionMainImage(auction: {
  productMainImage?: string;
  productImageUrl?: string;
  images?: string[];
}): string {
  const url =
    auction.productMainImage ||
    auction.productImageUrl ||
    auction.images?.[0];
  return resolveMediaUrl(url);
}

export function getDirectMainImage(listing: {
  productImageUrl?: string;
  productMainImage?: string;
  imageUrls?: string[];
}): string {
  const url =
    listing.productMainImage ||
    listing.productImageUrl ||
    listing.imageUrls?.[0];
  return resolveMediaUrl(url);
}

export function getTenderMainImage(tender: {
  productImageUrl?: string;
  productMainImage?: string;
  imageUrls?: string[];
}): string {
  return getDirectMainImage(tender);
}
