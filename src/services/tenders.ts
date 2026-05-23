import { apiGet, apiPost } from "@/lib/api";
import type { Tender } from "@/types";

export async function getOpenTenders(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<Tender[] | { items: Tender[] }>(
    `/api/tenders/open${qs}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

/** فلترة متقدمة — GET /api/tenders/filtered */
export async function getFilteredTenders(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  try {
    const data = await apiGet<Tender[] | { items: Tender[] }>(
      `/api/tenders/filtered${qs}`,
    );
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch {
    return getOpenTenders(params);
  }
}

export async function getTender(id: number) {
  return apiGet<Tender>(`/api/tenders/${id}`);
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
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getTendersCreatedByUser(userId: number) {
  const data = await apiGet<Tender[] | { items: Tender[] }>(
    `/api/tenders/userId/${userId}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}
