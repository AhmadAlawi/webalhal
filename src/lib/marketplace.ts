import type { Auction, MarketplaceListing, Tender } from "@/types";

export function getAuctionDisplayPrice(auction: Auction): number | undefined {
  return (
    auction.pricing?.currentPriceTotal ??
    auction.currentPrice ??
    auction.startingPrice ??
    auction.pricing?.startingPriceTotal
  );
}

export function getAuctionLocation(auction: Auction): string | undefined {
  const parts = [
    auction.farmCity,
    auction.farmGovernorate,
    auction.cityName,
    auction.governorateName,
  ].filter(Boolean);
  return parts.length ? parts.join(" — ") : undefined;
}

export function getTenderLocation(tender: Tender): string | undefined {
  return (
    tender.deliveryLocation ||
    [tender.farmCity, tender.farmGovernorate].filter(Boolean).join(" — ") ||
    undefined
  );
}

export function getListingLocation(listing: MarketplaceListing): string | undefined {
  return (
    listing.location ||
    [listing.farmCity, listing.farmGovernorate, listing.governorateName]
      .filter(Boolean)
      .join(" — ") ||
    undefined
  );
}

export function filterBrowseByCategory<T extends { categoryId?: number }>(
  items: T[],
  categoryId?: number,
): T[] {
  if (!categoryId) return items;
  return items.filter((item) => item.categoryId === categoryId);
}

export function filterBrowseBySearch<T>(
  items: T[],
  searchQuery: string,
  fields: (keyof T)[],
): T[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === "string" && val.toLowerCase().includes(q);
    }),
  );
}
