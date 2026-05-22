import { apiGet } from "@/lib/api";

export interface UserOffer {
  offerId?: number;
  tenderId?: number;
  price?: number;
  quantityOffered?: number;
  status?: string;
  tenderTitle?: string;
  cropName?: string;
}

export async function getOffersByUser(userId: number) {
  const data = await apiGet<UserOffer[] | { items?: UserOffer[] }>(
    `/api/tenders/offers/by-user/${userId}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}
