import { apiGet, apiPost } from "@/lib/api";
import type { Tender } from "@/types";

export function normalizeTender(raw: unknown): Tender {
  if (!raw || typeof raw !== "object") return raw as Tender;
  const r = raw as Record<string, unknown>;
  const tenderId = Number(r.tenderId ?? r.TenderId ?? r.id ?? r.Id);

  return {
    ...(raw as Tender),
    tenderId,
    productId: Number(r.productId ?? r.ProductId) || undefined,
    title: (r.title ?? r.Title) as string | undefined,
    description: (r.description ?? r.Description) as string | undefined,
    cropName: (r.cropName ?? r.CropName) as string | undefined,
    productNameAr: (r.productNameAr ?? r.ProductNameAr) as string | undefined,
    productNameEn: (r.productNameEn ?? r.ProductNameEn) as string | undefined,
    quantity: Number(r.quantity ?? r.Quantity) || undefined,
    unit: (r.unit ?? r.Unit) as string | undefined,
    maxBudget: Number(r.maxBudget ?? r.MaxBudget) || undefined,
    endTime: (r.endTime ?? r.EndTime) as string | undefined,
    startTime: (r.startTime ?? r.StartTime) as string | undefined,
    status: (r.status ?? r.Status) as string | undefined,
    createdByUserId: Number(r.createdByUserId ?? r.CreatedByUserId) || undefined,
    productImageUrl: (r.productImageUrl ?? r.ProductImageUrl) as string | undefined,
    productMainImage: (r.productMainImage ?? r.ProductMainImage) as string | undefined,
    deliveryLocation: (r.deliveryLocation ?? r.DeliveryLocation) as string | undefined,
    farmCity: (r.farmCity ?? r.FarmCity) as string | undefined,
    farmGovernorate: (r.farmGovernorate ?? r.FarmGovernorate) as string | undefined,
    categoryId: Number(r.categoryId ?? r.CategoryId) || undefined,
    categoryNameAr: (r.categoryNameAr ?? r.CategoryNameAr) as string | undefined,
    categoryNameEn: (r.categoryNameEn ?? r.CategoryNameEn) as string | undefined,
    sellerName: (r.sellerName ?? r.SellerName) as string | undefined,
    offersCount: Number(r.offersCount ?? r.OffersCount) || undefined,
  };
}

export async function getOpenTenders(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<Tender[] | { items: Tender[] }>(
    `/api/tenders/open${qs}`,
  );
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map(normalizeTender);
}

function buildTenderQueryParams(params?: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value == null || value === "") continue;
    if (key === "minPrice") normalized.minBudget = value;
    else if (key === "maxPrice") normalized.maxBudget = value;
    else if (key === "startTimeFrom") normalized.startDate = value;
    else if (key === "endTimeTo") normalized.endDate = value;
    else normalized[key] = value;
  }
  return normalized;
}

/** فلترة متقدمة — GET /api/tenders */
export async function getFilteredTenders(params?: Record<string, string>) {
  const tenderParams = buildTenderQueryParams(params);
  const qs = Object.keys(tenderParams).length
    ? `?${new URLSearchParams(tenderParams)}`
    : "";
  const data = await apiGet<Tender[] | { items: Tender[] }>(`/api/tenders${qs}`);
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map(normalizeTender);
}

export async function getTender(id: number) {
  const data = await apiGet<Tender>(`/api/tenders/${id}`);
  return normalizeTender(data);
}

export async function createTender(
  createdByUserId: number,
  body: Record<string, unknown>,
) {
  return apiPost(`/api/tenders?createdByUserId=${createdByUserId}`, body);
}

export async function getTenderOffers(tenderId: number) {
  return apiGet(`/api/offers/tender/${tenderId}`);
}

export async function createOffer(userId: number, body: Record<string, unknown>) {
  return apiPost(`/api/offers?supplierUserId=${userId}`, body);
}

export async function awardTender(tenderId: number, offerId: number) {
  return apiPost(`/api/tenders/${tenderId}/award/${offerId}`, {});
}

export async function finishTender(tenderId: number) {
  return apiPost(`/api/tenders/${tenderId}/finish`, {});
}

export async function getJoinedTenders(userId: number) {
  const data = await apiGet<Tender[] | { items: Tender[] }>(
    `/api/tenders/joined/by-user/${userId}`,
  );
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map(normalizeTender);
}

export async function getTendersCreatedByUser(userId: number) {
  const data = await apiGet<Tender[] | { items: Tender[] }>(
    `/api/tenders/userId/${userId}`,
  );
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map(normalizeTender);
}
