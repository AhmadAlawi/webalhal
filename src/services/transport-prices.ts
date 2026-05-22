import { apiGet, apiPost } from "@/lib/api";
import { unwrapEnvelopeData } from "@/lib/api-envelope";

export interface TransportPriceRequestDto {
  fromRegion?: string;
  toRegion?: string;
  distanceKm?: number;
}

export interface NegotiationPriceRequestDto extends TransportPriceRequestDto {
  requestId?: number;
  productType?: string;
  weightKg?: number;
}

export interface TransportPriceResult {
  price?: number;
  message?: string;
  fromRegion?: string;
  toRegion?: string;
  distanceKm?: number;
}

export async function fetchTransportRegions(): Promise<string[]> {
  const raw = await apiGet<unknown>("/api/transport-prices/regions");
  const data = unwrapEnvelopeData(raw) ?? raw;
  if (Array.isArray(data)) return data.filter((r): r is string => typeof r === "string");
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return ((data as { data: unknown[] }).data).filter((r): r is string => typeof r === "string");
  }
  return [];
}

export async function getOfficialTransportPrice(
  dto: TransportPriceRequestDto,
): Promise<TransportPriceResult> {
  const raw = await apiPost<unknown>("/api/transport-prices/official", dto);
  return (unwrapEnvelopeData(raw) ?? raw) as TransportPriceResult;
}

export async function getCheapestTransportPrice(
  dto: TransportPriceRequestDto,
): Promise<TransportPriceResult> {
  const raw = await apiPost<unknown>("/api/transport-prices/cheapest", dto);
  return (unwrapEnvelopeData(raw) ?? raw) as TransportPriceResult;
}

export async function startNegotiationTransportPrice(
  dto: NegotiationPriceRequestDto,
): Promise<TransportPriceResult> {
  const raw = await apiPost<unknown>("/api/transport-prices/negotiation", dto);
  return (unwrapEnvelopeData(raw) ?? raw) as TransportPriceResult;
}
