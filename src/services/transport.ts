import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { TransportRequest } from "@/types";
import type {
  AssignTransportPayload,
  City,
  TransportPriceLineMatch,
  TransportRequestDetail,
} from "@/types/transport";

export async function getBuyerRequests() {
  const data = await apiGet<TransportRequest[]>(
    "/api/transport/me/buyer-requests",
  );
  return Array.isArray(data) ? data : [];
}

export async function getNotifiedRequests() {
  const data = await apiGet<TransportRequest[]>(
    "/api/transport/me/notified-requests",
  );
  return Array.isArray(data) ? data : [];
}

export async function getAssignedRequests() {
  const data = await apiGet<TransportRequest[]>("/api/transport/me/requests");
  return Array.isArray(data) ? data : [];
}

export async function getNotifiedCount(): Promise<number> {
  try {
    const data = await apiGet<{ count: number }>(
      "/api/transport/me/notified-requests/count",
    );
    return data?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getCities() {
  const data = await apiGet<City[] | { items?: City[] }>("/api/cities");
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export async function getTransportMatches(
  fromCityId: number,
  toCityId: number,
  includeReverseRoute = true,
) {
  const sp = new URLSearchParams({
    fromCityId: String(fromCityId),
    toCityId: String(toCityId),
    includeReverseRoute: String(includeReverseRoute),
  });
  const data = await apiGet<
    TransportPriceLineMatch[] | { items?: TransportPriceLineMatch[] }
  >(`/api/transport/matches?${sp}`);
  return Array.isArray(data) ? data : data?.items ?? [];
}

/** أحدث طلب open/negotiating — لا يشمل المعيّن */
export async function getTransportByContext(orderType: string, orderId: number) {
  const sp = new URLSearchParams({
    orderType,
    orderId: String(orderId),
  });
  const data = await apiGet<TransportRequestDetail | null>(
    `/api/transport/requests/by-context?${sp}`,
  );
  return data;
}

/** يبحث في طلبات المشتري عن تعيين لهذه الصفقة (بما فيها assigned) */
export async function findBuyerTransportForDeal(
  orderType: string,
  orderId: number,
): Promise<TransportRequestDetail | null> {
  const list = await getBuyerRequests();
  const match = list.find(
    (r) =>
      r.orderType?.toLowerCase() === orderType.toLowerCase() &&
      (r as TransportRequestDetail).orderId === orderId,
  );
  return (match as TransportRequestDetail) ?? null;
}

export async function getTransportRequest(requestId: number) {
  return apiGet<TransportRequestDetail>(`/api/transport/requests/${requestId}`);
}

export async function assignTransport(body: AssignTransportPayload) {
  return apiPost<TransportRequestDetail>("/api/transport/assignments", body);
}

export async function createTransportRequest(body: Record<string, unknown>) {
  return apiPost("/api/transport/requests", body);
}

export async function submitTransportOffer(body: Record<string, unknown>) {
  return apiPost("/api/transport/offers", body);
}

export async function acceptOffer(offerId: number) {
  return apiPost(`/api/transport/offers/${offerId}/accept`, {});
}

export async function rejectOffer(offerId: number) {
  return apiPost(`/api/transport/offers/${offerId}/reject`, {});
}

export interface TransportOffer {
  offerId: number;
  transportRequestId?: number;
  transporterId?: number;
  transportProviderId?: number;
  offeredPrice?: number;
  status?: string;
  transporterName?: string;
  estimatedPickupDate?: string;
  estimatedDeliveryDate?: string;
}

export interface TransportPriceLine {
  priceLineId: number;
  transportProviderId: number;
  fromCityId: number;
  toCityId: number;
  price: number;
  governmentMaxPrice?: number;
  isActive?: boolean;
  fromRegion?: string;
  toRegion?: string;
}

export interface TransportProvider {
  transportProviderId: number;
  userId?: number;
  companyName?: string;
  name?: string;
  isAvailable?: boolean;
  priceLines?: TransportPriceLine[];
}

export async function getTransportProviders() {
  const data = await apiGet<TransportProvider[] | { items?: TransportProvider[] }>(
    "/api/transport",
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getProviderPriceLines(providerId: number) {
  const data = await apiGet<TransportPriceLine[] | { items?: TransportPriceLine[] }>(
    `/api/transport/${providerId}/price-lines`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function createPriceLine(body: {
  transportProviderId: number;
  fromCityId: number;
  toCityId: number;
  price: number;
}) {
  return apiPost<TransportPriceLine>("/api/transport/price-lines", body);
}

export async function setProviderAvailability(providerId: number, isAvailable: boolean) {
  return apiPost(`/api/transport/${providerId}/availability`, { isAvailable });
}

export async function getTransportRequestOffers(requestId: number) {
  const detail = await getTransportRequest(requestId);
  const offers = (detail as { offers?: TransportOffer[] })?.offers;
  return offers ?? [];
}

export async function notifyTransportRequest(requestId: number) {
  return apiPost<{ notifiedTransporters?: number; notifyHint?: string }>(
    `/api/transport/requests/${requestId}/notify`,
    {},
  );
}

export interface TransportTrackingPoint {
  trackingId?: number;
  latitude?: number;
  longitude?: number;
  recordedAt?: string;
  notes?: string;
}

export async function getTransportTracking(requestId: number) {
  const data = await apiGet<
    TransportTrackingPoint[] | { items?: TransportTrackingPoint[] }
  >(`/api/transport/requests/${requestId}/tracking`);
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function cancelTransportRequest(requestId: number) {
  return apiPost(`/api/transport/requests/${requestId}/cancel`, {});
}

export async function createTransportProvider(body: Record<string, unknown>) {
  return apiPost<TransportProvider>("/api/transport", body);
}

export async function getMyTransportProvider(userId: number) {
  const providers = await getTransportProviders();
  return providers.find((p) => p.userId === userId) ?? null;
}

export interface TransportVehicle {
  vehicleId?: number;
  transportVehicleId?: number;
  vehicleType?: string;
  capacity?: string;
  model?: string;
  pricePerKm?: number;
  isVerified?: boolean;
}

export async function getProviderVehicles(providerId: number) {
  const data = await apiGet<TransportVehicle[] | { items?: TransportVehicle[] }>(
    `/api/transport/${providerId}/vehicles`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function addProviderVehicle(
  providerId: number,
  body: Record<string, unknown>,
) {
  return apiPost<TransportVehicle>(`/api/transport/${providerId}/vehicles`, body);
}

export async function deleteProviderVehicle(providerId: number, vehicleId: number) {
  return apiDelete(`/api/transport/${providerId}/vehicle/${vehicleId}`);
}
