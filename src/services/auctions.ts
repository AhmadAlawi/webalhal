import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Auction, Bid } from "@/types";

export async function getOpenAuctions(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const data = await apiGet<Auction[] | { items: Auction[] }>(
    `/api/auctions/open${qs}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getAuction(id: number) {
  return apiGet<Auction>(`/api/auctions/${id}`);
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
  return apiPost(`/api/auctions/${auctionId}/access`, targetUserId);
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
