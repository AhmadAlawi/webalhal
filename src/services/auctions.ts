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
  return apiGet(`/api/auctions/${id}/join?userId=${userId}`);
}

export async function createAuction(
  userId: number,
  body: Record<string, unknown>,
) {
  return apiPost(`/api/auctions?createdByUserId=${userId}`, body);
}

export async function requestAuctionAccess(
  auctionId: number,
  targetUserId: number,
) {
  return apiPost(`/api/auctions/${auctionId}/access`, { targetUserId });
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
