"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isUserAuctionWinner, openAuctionDealChat } from "@/lib/auctionWinner";
import type { Auction, Bid } from "@/types";

export function AuctionWinnerChatButton({
  auction,
  bids,
  userId,
  label = "الذهاب إلى المحادثة",
  sublabel,
  fullWidth = true,
  variant = "primary",
  className,
}: {
  auction: Auction;
  bids: Bid[];
  userId?: number;
  label?: string;
  sublabel?: ReactNode;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!userId || !isUserAuctionWinner(userId, auction, bids)) {
    return null;
  }

  async function goToChat() {
    setLoading(true);
    setError("");
    try {
      const cid = await openAuctionDealChat(auction, bids);
      router.push(`/chat/${cid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل فتح المحادثة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {sublabel && <p className="mb-3 text-center text-sm font-medium text-emerald-100">{sublabel}</p>}
      <Button
        type="button"
        fullWidth={fullWidth}
        size="lg"
        variant={variant}
        onClick={() => void goToChat()}
        disabled={loading}
        className="gap-2"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        {loading ? "جاري الفتح..." : label}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-red-200">{error}</p>}
    </div>
  );
}
