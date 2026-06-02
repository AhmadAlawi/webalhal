import { apiGet, apiPost } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import type { MarketplaceBrowseData, MarketplaceListing } from "@/types";

function normalizeListing(raw: unknown): MarketplaceListing | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const listingId = Number(r.listingId ?? r.ListingId ?? r.id ?? r.Id);
  if (!Number.isFinite(listingId) || listingId <= 0) return null;

  const imageUrls = Array.isArray(r.imageUrls)
    ? (r.imageUrls as string[])
    : Array.isArray(r.ImageUrls)
      ? (r.ImageUrls as string[])
      : undefined;

  return {
    listingId,
    title: (r.title ?? r.Title) as string | undefined,
    cropName: (r.cropName ?? r.CropName) as string | undefined,
    productNameAr: (r.productNameAr ?? r.ProductNameAr) as string | undefined,
    unitPrice:
      Number(r.unitPrice ?? r.UnitPrice ?? r.price ?? r.Price) || undefined,
    availableQty:
      Number(
        r.availableQty ??
          r.AvailableQty ??
          r.quantity ??
          r.Quantity ??
          r.availableQuantity ??
          r.AvailableQuantity,
      ) || undefined,
    minOrderQty: Number(r.minOrderQty ?? r.MinOrderQty) || undefined,
    maxOrderQty: Number(r.maxOrderQty ?? r.MaxOrderQty) || undefined,
    unit: (r.unit ?? r.Unit) as string | undefined,
    farmCity: (r.farmCity ?? r.FarmCity) as string | undefined,
    governorateName: (r.governorateName ?? r.GovernorateName) as string | undefined,
    farmGovernorate: (r.farmGovernorate ?? r.FarmGovernorate) as string | undefined,
    location: (r.location ?? r.Location ?? r.deliveryLocation) as string | undefined,
    productImageUrl: (r.productImageUrl ?? r.ProductImageUrl) as string | undefined,
    productMainImage: (r.productMainImage ?? r.ProductMainImage) as string | undefined,
    imageUrls,
    status: String(r.status ?? r.Status ?? ""),
    sellerUserId: Number(r.sellerUserId ?? r.SellerUserId) || undefined,
    categoryId: Number(r.categoryId ?? r.CategoryId) || undefined,
    categoryNameAr: (r.categoryNameAr ?? r.CategoryNameAr) as string | undefined,
  };
}

function emptyBrowse(): MarketplaceBrowseData {
  return { auctions: [], tenders: [], direct: [] };
}

/** Home page feed: auctions + tenders + direct in one call */
export async function getMarketplaceBrowse(
  params?: Record<string, string>,
): Promise<MarketplaceBrowseData> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<MarketplaceBrowseData | null>(`${API.marketplace.browse}${qs}`);

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
    `${API.direct.listingsFiltered}${qs}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getListing(id: number) {
  const data = await apiGet<unknown>(API.direct.listingById(id));
  return normalizeListing(data) ?? (data as MarketplaceListing);
}

/** Swagger CreateListingDto — مطابق لتطبيق الموبايل */
export async function createListing(body: {
  sellerUserId: number;
  cropId: number;
  title?: string;
  price: number;
  unitPrice?: number;
  availableQty?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  unit?: string;
  cropName?: string;
  imageUrls?: string[];
}) {
  const unitPrice = body.unitPrice ?? body.price;
  return apiPost(API.direct.listings, {
    ...body,
    unitPrice,
    price: unitPrice,
  });
}

export async function createOrder(body: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>(API.direct.orders, body);
}

export async function getMyOrders() {
  return apiGet(API.direct.orders);
}
