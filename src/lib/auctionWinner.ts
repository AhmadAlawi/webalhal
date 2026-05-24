import { getAuctionSellerId } from "@/lib/auctionPricing";
import type { Auction, Bid } from "@/types";

/** أعلى مزايدة عند عدم إرجاع winnerUserId من الـ API */
export function resolveAuctionWinner(
  auction: Auction | null | undefined,
  bids: Bid[],
): number | undefined {
  const fromApi = auction?.winnerUserId;
  if (fromApi != null && Number.isFinite(fromApi) && fromApi > 0) {
    return fromApi;
  }

  if (!bids.length) return undefined;

  const sorted = [...bids].sort((a, b) => {
    if (b.bidAmount !== a.bidAmount) return b.bidAmount - a.bidAmount;
    const tb = new Date(b.createdAt ?? 0).getTime();
    const ta = new Date(a.createdAt ?? 0).getTime();
    return tb - ta;
  });

  const winnerId = sorted[0]?.bidderUserId;
  return winnerId != null && winnerId > 0 ? winnerId : undefined;
}

export function isUserAuctionWinner(
  userId: number | undefined,
  auction: Auction | null | undefined,
  bids: Bid[],
): boolean {
  if (!userId) return false;
  const winnerId = resolveAuctionWinner(auction, bids);
  return winnerId != null && winnerId === userId;
}

export function getAuctionConversationId(auction: Auction | null | undefined): number | undefined {
  if (!auction) return undefined;
  const id = auction.chatConversationId ?? auction.conversationId;
  return id != null && id > 0 ? id : undefined;
}

export async function openAuctionDealChat(
  auction: Auction,
  bids: Bid[],
): Promise<number> {
  const winnerId = resolveAuctionWinner(auction, bids);
  const sellerId = getAuctionSellerId(auction);
  if (!winnerId || !sellerId) {
    throw new Error("تعذر تحديد الفائز أو البائع");
  }

  const existing = getAuctionConversationId(auction);
  if (existing) return existing;

  const { openConversation, parseConversationIdFromOpen } = await import("@/services/chat");
  const res = await openConversation("auction", auction.auctionId, {
    buyerUserId: winnerId,
    sellerUserId: sellerId,
  });
  const cid = parseConversationIdFromOpen(res);
  if (!cid) throw new Error("تعذر فتح المحادثة");
  return cid;
}
