import { apiGet, apiPost, apiPut } from "@/lib/api";
import { parseAuctionPricing } from "@/lib/auctionPricing";
import type { Auction, Bid } from "@/types";

function normalizeAuction(raw: unknown): Auction {
  if (!raw || typeof raw !== "object") {
    return raw as Auction;
  }
  const r = raw as Record<string, unknown>;
  const auctionId = Number(r.auctionId ?? r.AuctionId ?? r.id);
  const pricingParsed = parseAuctionPricing(r.pricing ?? r.Pricing);
  const sellerUserId =
    Number(r.sellerUserId ?? r.SellerUserId ?? r.createdByUserId ?? r.CreatedByUserId) ||
    undefined;

  return {
    auctionId,
    auctionTitle: (r.auctionTitle ?? r.AuctionTitle) as string | undefined,
    auctionDescription: (r.auctionDescription ?? r.AuctionDescription) as string | undefined,
    cropName: (r.cropName ?? r.CropName) as string | undefined,
    productNameAr: (r.productNameAr ?? r.ProductNameAr) as string | undefined,
    startingPrice: Number(r.startingPrice ?? r.StartingPrice ?? pricingParsed?.startingPriceTotal) || undefined,
    currentPrice: Number(r.currentPrice ?? r.CurrentPrice ?? pricingParsed?.currentPriceTotal) || undefined,
    minIncrement: Number(r.minIncrement ?? r.MinIncrement ?? pricingParsed?.minIncrementTotal) || undefined,
    maxPrice: Number(r.maxPrice ?? r.MaxPrice ?? pricingParsed?.maxPriceTotal) || undefined,
    startTime: (r.startTime ?? r.StartTime) as string | undefined,
    endTime: (r.endTime ?? r.EndTime) as string | undefined,
    secondEndTime: (r.secondEndTime ?? r.SecondEndTime) as string | undefined,
    status: (r.status ?? r.Status) as string | undefined,
    lifecycleStatus: (r.lifecycleStatus ?? r.LifecycleStatus) as string | undefined,
    isBiddable: (r.isBiddable ?? r.IsBiddable) as boolean | undefined,
    productMainImage: (r.productMainImage ?? r.ProductMainImage) as string | undefined,
    productImageUrl: (r.productImageUrl ?? r.ProductImageUrl) as string | undefined,
    images: Array.isArray(r.images) ? (r.images as string[]) : undefined,
    cropUnit: (r.cropUnit ?? r.CropUnit ?? pricingParsed?.unit) as string | undefined,
    cropQuantity: Number(r.cropQuantity ?? r.CropQuantity ?? pricingParsed?.quantity) || undefined,
    unit: (r.unit ?? r.Unit ?? r.cropUnit) as string | undefined,
    quantity: Number(r.quantity ?? r.Quantity ?? r.cropQuantity) || undefined,
    governorateName: (r.governorateName ?? r.GovernorateName) as string | undefined,
    cityName: (r.cityName ?? r.CityName) as string | undefined,
    farmCity: (r.farmCity ?? r.FarmCity) as string | undefined,
    farmGovernorate: (r.farmGovernorate ?? r.FarmGovernorate) as string | undefined,
    categoryNameAr: (r.categoryNameAr ?? r.CategoryNameAr) as string | undefined,
    sellerUserId,
    createdByUserId: sellerUserId,
    winnerUserId:
      Number(r.winnerUserId ?? r.WinnerUserId ?? r.winnerId ?? r.WinnerId) || undefined,
    chatConversationId:
      Number(
        r.chatConversationId ??
          r.ChatConversationId ??
          r.conversationId ??
          r.ConversationId,
      ) || undefined,
    conversationId:
      Number(r.conversationId ?? r.ConversationId ?? r.chatConversationId) || undefined,
    bidsCount: Number(r.bidsCount ?? r.BidsCount) || undefined,
    pricing: pricingParsed ?? undefined,
  };
}

export async function getOpenAuctions(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<Auction[] | { items: Auction[] }>(
    `/api/auctions/open${qs}`,
  );
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map(normalizeAuction);
}

export async function getAuction(id: number) {
  const data = await apiGet<Auction>(`/api/auctions/${id}`);
  return normalizeAuction(data);
}

export async function getAuctionBids(auctionId: number) {
  return apiGet<Bid[]>(`/api/auctions/bids/${auctionId}`);
}

export async function joinAuction(id: number, userId: number) {
  return apiGet(`/api/auctions/${id}/join?userId=${encodeURIComponent(String(userId))}`);
}

/** فشل انضمام HTTP بسبب مزاد خاص أو صلاحيات */
export function isAuctionJoinAccessError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { status?: number }).status;
  const msg = String(
    (err as { message?: string }).message ??
      (err as { detail?: string }).detail ??
      "",
  ).toLowerCase();
  if (status === 401 || status === 403) return true;
  return (
    msg.includes("private") ||
    msg.includes("access") ||
    msg.includes("صلاحية") ||
    msg.includes("غير مصرح") ||
    msg.includes("denied")
  );
}

export async function createAuction(
  userId: number,
  body: Record<string, unknown>,
) {
  return apiPost(`/api/auctions?createdByUserId=${userId}`, body);
}

/** Swagger: body is raw user id (integer JSON) */
export async function requestAuctionAccess(
  auctionId: number,
  targetUserId: number,
) {
  return apiPost<Record<string, unknown>>(
    `/api/auctions/${auctionId}/access`,
    targetUserId,
  );
}

export async function placeBidHttp(
  auctionId: number,
  bidderUserId: number,
  bidAmount: number,
) {
  return apiPost(`/api/auctions/${auctionId}/bids`, {
    auctionId,
    bidderUserId,
    bidAmount,
  });
}

export async function getJoinedAuctions(userId: number) {
  const data = await apiGet<Auction[] | { items: Auction[] }>(
    `/api/auctions/joined/by-user/${userId}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getAuctionsCreatedByUser(userId: number) {
  const data = await apiGet<Auction[] | { items: Auction[] }>(
    `/api/auctions/by-user/${userId}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function updateAuction(
  auctionId: number,
  body: Record<string, unknown>,
) {
  return apiPut<Auction>(`/api/auctions/${auctionId}`, body);
}
