import type { AuctionPricing } from "@/types";

export function parseAuctionPricing(raw: unknown): AuctionPricing | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return {
    bidAmountBasis: (p.bidAmountBasis as "total" | "perUnit") ?? "total",
    currentPriceTotal: Number(p.currentPriceTotal ?? p.currentPrice ?? 0),
    currentPricePerUnit: Number(p.currentPricePerUnit ?? 0),
    minIncrementTotal: Number(p.minIncrementTotal ?? p.minIncrement ?? 0),
    minIncrementPerUnit: Number(p.minIncrementPerUnit ?? 0),
    maxPriceTotal: p.maxPriceTotal != null ? Number(p.maxPriceTotal) : null,
    quantity: Number(p.quantity ?? 1),
    unit: String(p.unit ?? "كغ"),
  };
}

export function resolvePlaceBidAmount(
  pricing: AuctionPricing,
  inputAmount: number,
): number {
  if (pricing.bidAmountBasis === "perUnit") {
    return inputAmount * pricing.quantity;
  }
  return inputAmount;
}

export function getMinNextBid(pricing: AuctionPricing): number {
  if (pricing.bidAmountBasis === "perUnit") {
    return pricing.currentPricePerUnit + pricing.minIncrementPerUnit;
  }
  return pricing.currentPriceTotal + pricing.minIncrementTotal;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("ar-SY").format(amount);
}
