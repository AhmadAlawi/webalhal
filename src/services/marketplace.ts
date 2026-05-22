import { apiGet, apiPost } from "@/lib/api";
import type { MarketplaceBrowseData, MarketplaceListing } from "@/types";

function emptyBrowse(): MarketplaceBrowseData {
  return { auctions: [], tenders: [], direct: [] };
}

/** Home page feed: auctions + tenders + direct in one call */
export async function getMarketplaceBrowse(
  params?: Record<string, string>,
): Promise<MarketplaceBrowseData> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<MarketplaceBrowseData | null>(`/api/marketplace/browse${qs}`);

  if (!data || typeof data !== "object") return emptyBrowse();

  return {
    auctions: Array.isArray(data.auctions) ? data.auctions : [],
    tenders: Array.isArray(data.tenders) ? data.tenders : [],
    direct: Array.isArray(data.direct) ? data.direct : [],
  };
}

/** @deprecated Use getMarketplaceBrowse — returns direct listings only */
export async function getMarketplace(params?: Record<string, string>) {
  const browse = await getMarketplaceBrowse(params);
  return browse.direct;
}

/** قائمة مفلترة — GET /api/direct/listings/filtered */
export async function getFilteredDirectListings(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<MarketplaceListing[] | { items?: MarketplaceListing[] }>(
    `/api/direct/listings/filtered${qs}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getListing(id: number) {
  return apiGet<MarketplaceListing>(`/api/direct/listings/${id}`);
}

export async function createListing(body: Record<string, unknown>) {
  return apiPost("/api/direct/listings", body);
}

export async function createOrder(body: Record<string, unknown>) {
  return apiPost("/api/direct/orders", body);
}

export async function getMyOrders() {
  return apiGet("/api/direct/orders");
}
