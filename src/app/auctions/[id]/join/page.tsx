"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { HubConnection } from "@microsoft/signalr";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { joinAuction, getAuction } from "@/services/auctions";
import { startAuctionHub, stopAuctionHub } from "@/lib/signalr";
import {
  formatPrice,
  getMinNextBid,
  parseAuctionPricing,
  resolvePlaceBidAmount,
} from "@/lib/auctionPricing";
import type { AuctionPricing } from "@/types";

export default function AuctionJoinPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user, requireAuth, isAuthenticated } = useAuth();
  const auctionId = Number(id);
  const connectionRef = useRef<HubConnection | null>(null);
  const inviteRef = useRef(searchParams.get("invite") ?? "");

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pricing, setPricing] = useState<AuctionPricing | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [inviteCode, setInviteCode] = useState(inviteRef.current);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const onPriceTick = useCallback((data: unknown) => {
    const p = parseAuctionPricing(data);
    if (p) {
      setPricing(p);
      setBidInput(String(getMinNextBid(p)));
    }
  }, []);

  useEffect(() => {
    if (!requireAuth() || !auctionId) return;
    getAuction(auctionId).then((a) => {
      if (!a) return;
      const p = parseAuctionPricing({
        bidAmountBasis: "total",
        currentPriceTotal: a.currentPrice ?? a.startingPrice ?? 0,
        minIncrementTotal: 1000,
        quantity: a.quantity ?? 1,
        unit: a.unit ?? "كغ",
      });
      if (p) setPricing(p);
    });
  }, [auctionId, requireAuth]);

  const connectHub = useCallback(async () => {
    if (!isAuthenticated || !user?.userId || !auctionId || connecting) return;

    inviteRef.current = inviteCode.trim();
    setConnecting(true);
    setError("");

    if (connectionRef.current) {
      await stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
      setConnected(false);
    }

    try {
      await joinAuction(auctionId, user.userId);
      const conn = await startAuctionHub(auctionId, inviteRef.current || null, {
        onPriceTick,
        onBidPlaced: () => setStatus("تم تسجيل مزايدة جديدة"),
      });
      connectionRef.current = conn;

      const price = await conn.invoke<unknown>("GetCurrentPrice", auctionId);
      const p = parseAuctionPricing(price);
      if (p) {
        setPricing(p);
        setBidInput(String(getMinNextBid(p)));
      }

      setConnected(true);
      setStatus("متصل بالمزاد الحي");
    } catch (e) {
      setError((e as Error).message || "فشل الاتصال بالمزاد");
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [
    auctionId,
    user?.userId,
    isAuthenticated,
    inviteCode,
    connecting,
    onPriceTick,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !auctionId) return;
    void connectHub();
    return () => {
      void stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
    };
    // اتصال مرة واحدة عند الدخول — لا يعاد عند تغيير كود الدعوة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, isAuthenticated, user?.userId]);

  async function placeBid() {
    if (!connectionRef.current || !user?.userId || !pricing) return;
    const amount = Number(bidInput);
    if (!amount || amount <= 0) {
      setError("أدخل مبلغاً صالحاً");
      return;
    }
    const bidAmount = resolvePlaceBidAmount(pricing, amount);
    if (pricing.maxPriceTotal != null && bidAmount > pricing.maxPriceTotal) {
      setError("تجاوزت السقف الحكومي للسعر");
      return;
    }
    try {
      await connectionRef.current.invoke("PlaceBid", {
        AuctionId: auctionId,
        BidderUserId: user.userId,
        bidAmount,
      });
      setStatus("تم إرسال مزايدتك");
      setError("");
    } catch (e) {
      setError((e as Error).message || "فشل إرسال المزايدة");
    }
  }

  return (
    <>
      <PageHeader title="مزايدة حية" backHref={`/auctions/${id}`} />

      <PageContainer narrow className="py-8">
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div
            className={`rounded-2xl px-4 py-2 text-sm ${
              connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {status || (connecting ? "جاري الاتصال..." : connected ? "متصل" : "غير متصل")}
          </div>

          {!connected && (
            <>
              <Input
                label="كود الدعوة (مزاد خاص)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={connecting}
                onClick={() => void connectHub()}
              >
                {connecting ? "جاري الاتصال..." : "اتصال بالمزاد"}
              </Button>
            </>
          )}

          {pricing && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">السعر الحالي</p>
              <p className="text-3xl font-bold text-emerald-600">
                {formatPrice(pricing.currentPriceTotal)} ل.س
              </p>
              <p className="mt-1 text-xs text-slate-400">
                الحد الأدنى للزيادة: {formatPrice(pricing.minIncrementTotal)} ل.س
              </p>
            </div>
          )}

          <Input
            label="مبلغ المزايدة"
            type="number"
            value={bidInput}
            onChange={(e) => setBidInput(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button fullWidth onClick={placeBid} disabled={!connected || connecting}>
            تأكيد المزايدة
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
