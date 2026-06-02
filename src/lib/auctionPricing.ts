import type { AuctionPricing } from "@/types";

export function parseAuctionPricing(raw: unknown): AuctionPricing | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const quantity = Number(p.quantity ?? p.cropQuantity ?? 1) || 1;
  return {
    bidAmountBasis: (p.bidAmountBasis as "total" | "perUnit") ?? "total",
    startingPriceTotal: Number(
      p.startingPriceTotal ?? p.startingPrice ?? p.currentPriceTotal ?? 0,
    ),
    startingPricePerUnit: Number(p.startingPricePerUnit ?? 0),
    currentPriceTotal: Number(
      p.currentPriceTotal ?? p.currentPrice ?? p.startingPriceTotal ?? p.startingPrice ?? 0,
    ),
    currentPricePerUnit: Number(p.currentPricePerUnit ?? 0),
    minIncrementTotal: Number(p.minIncrementTotal ?? p.minIncrement ?? 0),
    minIncrementPerUnit: Number(p.minIncrementPerUnit ?? 0),
    maxPriceTotal:
      p.maxPriceTotal != null
        ? Number(p.maxPriceTotal)
        : p.maxPrice != null
          ? Number(p.maxPrice)
          : null,
    maxPricePerUnit: p.maxPricePerUnit != null ? Number(p.maxPricePerUnit) : null,
    quantity,
    unit: String(p.unit ?? p.cropUnit ?? "كغ"),
  };
}

export function getAuctionSellerId(auction: {
  sellerUserId?: number;
  createdByUserId?: number;
}): number | undefined {
  return auction.sellerUserId ?? auction.createdByUserId;
}

export function isAuctionOpen(auction: {
  status?: string;
  lifecycleStatus?: string;
  isBiddable?: boolean;
}): boolean {
  if (auction.isBiddable === false) return false;
  const status = (auction.status ?? auction.lifecycleStatus ?? "").toLowerCase();
  return status === "open" || auction.lifecycleStatus === "OPEN";
}

const PRICE_EPS = 0.01;

export function resolvePlaceBidAmount(
  pricing: AuctionPricing,
  inputAmount: number,
): number {
  if (pricing.bidAmountBasis === "perUnit") {
    return inputAmount * pricing.quantity;
  }
  return inputAmount;
}

function currentBidValue(pricing: AuctionPricing): number {
  return pricing.bidAmountBasis === "perUnit"
    ? pricing.currentPricePerUnit
    : pricing.currentPriceTotal;
}

function maxBidValue(pricing: AuctionPricing): number | null {
  if (pricing.bidAmountBasis === "perUnit") {
    return pricing.maxPricePerUnit ?? null;
  }
  return pricing.maxPriceTotal;
}

function minIncrementValue(pricing: AuctionPricing): number {
  return pricing.bidAmountBasis === "perUnit"
    ? pricing.minIncrementPerUnit
    : pricing.minIncrementTotal;
}

/** السعر الحالي وصل أو تجاوز السقف الأعلى */
export function isAtMaxPrice(pricing: AuctionPricing): boolean {
  const max = maxBidValue(pricing);
  if (max == null) return false;
  return currentBidValue(pricing) >= max - PRICE_EPS;
}

/** الزيادة العادية ستتجاوز السقف — يُسمح بمزايدات صغيرة حتى السقف */
export function isNearMaxPrice(pricing: AuctionPricing): boolean {
  const max = maxBidValue(pricing);
  if (max == null) return false;
  const nextStandard = currentBidValue(pricing) + minIncrementValue(pricing);
  return nextStandard > max + PRICE_EPS;
}

export function getMinNextBid(pricing: AuctionPricing): number {
  const current = currentBidValue(pricing);
  const max = maxBidValue(pricing);
  const increment = minIncrementValue(pricing);

  if (max != null && current + increment > max + PRICE_EPS) {
    if (current >= max - PRICE_EPS) return max;
    return Math.min(current + 1, max);
  }

  return current + increment;
}

export function getMaxBidInput(pricing: AuctionPricing): number | null {
  return maxBidValue(pricing);
}

export type AuctionEndReason = "max_price" | "closed" | "time" | null;

export function getAuctionEndState(
  auction: {
    status?: string;
    lifecycleStatus?: string;
    isBiddable?: boolean;
    endTime?: string;
  } | null,
  pricing: AuctionPricing | null,
): { ended: boolean; reason: AuctionEndReason; message: string } {
  if (pricing && isAtMaxPrice(pricing)) {
    return {
      ended: true,
      reason: "max_price",
      message: "انتهى المزاد — وُصل للسقف الأعلى",
    };
  }

  if (auction) {
    if (!isAuctionOpen(auction)) {
      return { ended: true, reason: "closed", message: "انتهى المزاد" };
    }
    if (auction.endTime) {
      const endMs = new Date(auction.endTime).getTime();
      if (Number.isFinite(endMs) && Date.now() >= endMs) {
        return { ended: true, reason: "time", message: "انتهى المزاد — انتهى الوقت" };
      }
    }
  }

  return { ended: false, reason: null, message: "" };
}

/** يُستدعى من SignalR عند تغيّر حالة المزاد */
export function isAuctionEndedPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const r = data as Record<string, unknown>;
  if (r.isBiddable === false) return true;
  const status = String(r.status ?? r.Status ?? r.lifecycleStatus ?? r.LifecycleStatus ?? "")
    .toLowerCase();
  if (["closed", "ended", "cancelled", "completed"].includes(status)) return true;
  if (r.lifecycleStatus === "CLOSED" || r.lifecycleStatus === "ENDED") return true;
  const pricing = parseAuctionPricing(r.pricing ?? r);
  return pricing != null && isAtMaxPrice(pricing);
}

export function validateBid(pricing: AuctionPricing, inputAmount: number): string | null {
  if (!Number.isFinite(inputAmount) || inputAmount <= 0) {
    return "أدخل مبلغاً صالحاً";
  }

  if (isAtMaxPrice(pricing)) {
    return "انتهى المزاد — وُصل للسقف الأعلى";
  }

  const input = inputAmount;
  const bidTotal = resolvePlaceBidAmount(pricing, inputAmount);
  const current = currentBidValue(pricing);
  const max = maxBidValue(pricing);

  if (input <= current + PRICE_EPS) {
    return "يجب أن يكون المبلغ أعلى من السعر الحالي";
  }

  if (max != null && input > max + PRICE_EPS) {
    return "تجاوزت السقف الأعلى للسعر";
  }

  if (!isNearMaxPrice(pricing)) {
    const minNext = getMinNextBid(pricing);
    if (input < minNext - PRICE_EPS) {
      return `أقل مزايدة مقبولة: ${formatPrice(minNext)} ل.س`;
    }
  }

  if (max != null && bidTotal > (pricing.maxPriceTotal ?? bidTotal) + PRICE_EPS) {
    return "تجاوزت السقف الأعلى للسعر";
  }

  return null;
}

export function formatPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return "—";
  return new Intl.NumberFormat("ar-SY").format(amount);
}
