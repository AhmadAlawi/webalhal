import { apiGet, apiPost } from "@/lib/api";
import type { MarketplaceListing } from "@/types";

export interface DirectOrder {
  orderId?: number;
  id?: number;
  status?: string;
  qty?: number;
  totalPrice?: number;
  unitPrice?: number;
  listingTitle?: string;
  cropName?: string;
  productNameAr?: string;
  buyerUserId?: number;
  sellerUserId?: number;
  listingId?: number;
  createdAt?: string;
  deliveryAddress?: string;
}

function asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function getDirectOrder(orderId: number) {
  return apiGet<DirectOrder>(`/api/direct/orders/${orderId}`);
}

export async function getBuyerOrders(userId: number) {
  const data = await apiGet<DirectOrder[] | { items?: DirectOrder[] }>(
    `/api/direct/buyers/${userId}/orders`,
  );
  return asArray(data);
}

export async function getSellerOrders(userId: number) {
  const data = await apiGet<DirectOrder[] | { items?: DirectOrder[] }>(
    `/api/direct/sellers/${userId}/orders`,
  );
  return asArray(data);
}

export async function getMyDirectListings(userId: number) {
  const data = await apiGet<MarketplaceListing[] | { items?: MarketplaceListing[] }>(
    `/api/direct/listings/filtered?sellerUserId=${userId}`,
  );
  try {
    return asArray(data);
  } catch {
    const all = await apiGet<MarketplaceListing[] | { items?: MarketplaceListing[] }>(
      "/api/direct/listings/filtered",
    );
    const list = asArray(all);
    return list.filter(
      (l) => (l as { sellerUserId?: number }).sellerUserId === userId,
    );
  }
}
