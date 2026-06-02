import { apiGet, apiPost } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
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
  chatId?: number;
}

function normalizeOrder(raw: unknown): DirectOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const orderId = Number(r.orderId ?? r.OrderId ?? r.id ?? r.Id);
  if (!Number.isFinite(orderId) || orderId <= 0) return null;

  return {
    orderId,
    id: orderId,
    status: String(r.status ?? r.Status ?? ""),
    qty: Number(r.qty ?? r.Qty) || undefined,
    totalPrice: Number(r.totalPrice ?? r.TotalPrice ?? r.total ?? r.Total) || undefined,
    unitPrice: Number(r.unitPrice ?? r.UnitPrice ?? r.subtotal ?? r.Subtotal) || undefined,
    listingTitle: (r.listingTitle ?? r.ListingTitle ?? r.title) as string | undefined,
    cropName: (r.cropName ?? r.CropName) as string | undefined,
    productNameAr: (r.productNameAr ?? r.ProductNameAr) as string | undefined,
    buyerUserId: Number(r.buyerUserId ?? r.BuyerUserId) || undefined,
    sellerUserId: Number(r.sellerUserId ?? r.SellerUserId) || undefined,
    listingId: Number(r.listingId ?? r.ListingId) || undefined,
    createdAt: (r.createdAt ?? r.CreatedAt) as string | undefined,
    deliveryAddress: (r.deliveryAddress ?? r.DeliveryAddress) as string | undefined,
    chatId: Number(r.chatId ?? r.ChatId) || undefined,
  };
}

function normalizeOrders(payload: unknown): DirectOrder[] {
  return asApiList(payload)
    .map(normalizeOrder)
    .filter((o): o is DirectOrder => o != null);
}

export async function getDirectOrder(orderId: number) {
  const raw = await apiGet<unknown>(`/api/direct/orders/${orderId}`);
  return normalizeOrder(raw) ?? (raw as DirectOrder);
}

export async function getBuyerOrders(userId: number) {
  const data = await apiGet<unknown>(`/api/direct/buyers/${userId}/orders`);
  return normalizeOrders(data);
}

export async function getSellerOrders(userId: number) {
  const data = await apiGet<unknown>(`/api/direct/sellers/${userId}/orders`);
  return normalizeOrders(data);
}

export async function updateDirectOrderStatus(
  orderId: number,
  newStatus: string,
) {
  return apiPost(`/api/direct/orders/${orderId}/status`, {
    orderId,
    newStatus,
  });
}

export async function cancelDirectOrder(orderId: number) {
  return apiPost(`/api/direct/orders/${orderId}/cancel`, {});
}

export async function getMyDirectListings(userId: number) {
  const data = await apiGet<MarketplaceListing[] | { items?: MarketplaceListing[] }>(
    `/api/direct/listings/filtered?sellerUserId=${encodeURIComponent(String(userId))}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export function parseOrderFromCreate(res: unknown): {
  orderId?: number;
  chatId?: number;
  sellerUserId?: number;
  buyerUserId?: number;
} {
  const r = res as Record<string, unknown>;
  const inner = (r?.data as Record<string, unknown>) ?? r;
  return {
    orderId: Number(inner.orderId ?? inner.OrderId ?? inner.id) || undefined,
    chatId: Number(inner.chatId ?? inner.ChatId) || undefined,
    sellerUserId: Number(inner.sellerUserId ?? inner.SellerUserId) || undefined,
    buyerUserId: Number(inner.buyerUserId ?? inner.BuyerUserId) || undefined,
  };
}
