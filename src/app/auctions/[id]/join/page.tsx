"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import {
  getAuction,
  joinAuction,
  placeBidHttp,
  isAuctionJoinAccessError,
} from "@/services/auctions";
import {
  startAuctionHub,
  stopAuctionHub,
  parseHubError,
  invokeHubWhenConnected,
} from "@/lib/signalr";
import {
  formatPrice,
  getMinNextBid,
  parseAuctionPricing,
  resolvePlaceBidAmount,
} from "@/lib/auctionPricing";
import type { AuctionPricing } from "@/types";

type ConnState = "idle" | "connecting" | "connected" | "reconnecting" | "error";

export default function AuctionJoinPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user, requireAuth, isAuthenticated } = useAuth();
  const auctionId = Number(id);
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef(false);
  const inviteFromUrl = searchParams.get("invite") ?? "";

  const [connState, setConnState] = useState<ConnState>("idle");
  const [bidding, setBidding] = useState(false);
  const [pricing, setPricing] = useState<AuctionPricing | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [inviteCode, setInviteCode] = useState(inviteFromUrl);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessBlocked, setAccessBlocked] = useState(false);

  const applyPricing = useCallback((data: unknown) => {
    const p = parseAuctionPricing(data);
    if (p) {
      setPricing(p);
      setBidInput(String(getMinNextBid(p)));
    }
  }, []);

  const onPriceTick = useCallback(
    (data: unknown) => {
      applyPricing(data);
    },
    [applyPricing],
  );

  const onBidPlaced = useCallback(
    (data: unknown) => {
      applyPricing(data);
      setStatus("تم تسجيل مزايدة جديدة على المزاد");
      const raw = data as Record<string, unknown> | null;
      if (raw && Number(raw.userId) === user?.userId) {
        setSuccess("تم تقديم عرضك بنجاح");
      }
    },
    [applyPricing, user?.userId],
  );

  useEffect(() => {
    if (!requireAuth() || !auctionId) return;
    getAuction(auctionId)
      .then((a) => {
        if (a) applyPricing(a);
      })
      .catch(() => {});
  }, [auctionId, requireAuth, applyPricing]);

  const connectHub = useCallback(async () => {
    if (!isAuthenticated || !user?.userId || !auctionId || connectingRef.current) {
      return;
    }

    const code = inviteCode.trim() || inviteFromUrl.trim();
    connectingRef.current = true;
    setConnState("connecting");
    setError("");
    setSuccess("");
    setAccessBlocked(false);

    if (connectionRef.current) {
      await stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
    }

    try {
      try {
        await joinAuction(auctionId, user.userId);
      } catch (joinErr) {
        if (isAuctionJoinAccessError(joinErr)) {
          setAccessBlocked(true);
          setError("مزاد خاص — اطلب الدخول من صفحة المزاد أو أدخل رمز الدعوة");
        }
      }

      const conn = await startAuctionHub(
        auctionId,
        user.userId,
        code || null,
        {
          onPriceTick,
          onBidPlaced,
          onError: (msg) => setError(msg),
          onConnectionState: (s) => {
            if (s === "connected") setConnState("connected");
            else if (s === "reconnecting") setConnState("reconnecting");
            else if (s === "disconnected") setConnState("idle");
          },
        },
      );
      connectionRef.current = conn;

      try {
        const price = await invokeHubWhenConnected(
          conn,
          "GetCurrentPrice",
          auctionId,
        );
        applyPricing(price);
      } catch {
        /* optional */
      }

      setConnState("connected");
      setStatus("متصل بالمزاد الحي — يمكنك المزايدة");
    } catch (e) {
      const msg = parseHubError(e);
      setError(msg || "فشل الاتصال — تحقق من كود الدعوة للمزاد الخاص");
      setConnState("error");
      if (isAuctionJoinAccessError(e)) setAccessBlocked(true);
    } finally {
      connectingRef.current = false;
    }
  }, [
    auctionId,
    user?.userId,
    isAuthenticated,
    inviteCode,
    inviteFromUrl,
    onPriceTick,
    onBidPlaced,
    applyPricing,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId || !auctionId) return;
    void connectHub();
    return () => {
      void stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
    };
  }, [auctionId, user?.userId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- اتصال عند فتح الصفحة فقط

  async function placeBid() {
    if (!user?.userId || !pricing) return;
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

    setBidding(true);
    setError("");
    setSuccess("");

    try {
      const conn = connectionRef.current;
      if (conn?.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("PlaceBid", {
          AuctionId: auctionId,
          BidderUserId: user.userId,
          bidAmount,
        });
        setSuccess("تم إرسال مزايدتك بنجاح");
        setStatus("مزايدتك قيد المعالجة");
      } else {
        await placeBidHttp(auctionId, user.userId, bidAmount);
        setSuccess("تم إرسال مزايدتك (بدون اتصال حي)");
        const refreshed = await getAuction(auctionId).catch(() => null);
        if (refreshed) applyPricing(refreshed);
      }
    } catch (e) {
      setError(parseHubError(e));
    } finally {
      setBidding(false);
    }
  }

  const connected = connState === "connected";
  const connecting = connState === "connecting" || connState === "reconnecting";

  return (
    <>
      <PageHeader title="مزايدة حية" backHref={`/auctions/${id}`} />

      <PageContainer narrow className="py-8">
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div
            className={`rounded-2xl px-4 py-2 text-sm ${
              connected
                ? "bg-emerald-50 text-emerald-700"
                : connState === "reconnecting"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {connState === "reconnecting"
              ? "إعادة الاتصال بالمزاد..."
              : status ||
                (connecting ? "جاري الاتصال..." : connected ? "متصل" : "غير متصل")}
          </div>

          {!connected && (
            <>
              <Input
                label="كود الدعوة (مزاد خاص)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="أدخل كود الدعوة إن وُجد"
              />
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={connecting}
                onClick={() => void connectHub()}
              >
                {connecting ? "جاري الاتصال..." : "إعادة الاتصال"}
              </Button>
            </>
          )}

          {accessBlocked && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              إذا كان المزاد خاصاً: اطلب الدخول من صفحة تفاصيل المزاد ثم أعد المحاولة برمز
              الدعوة.
            </p>
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
            disabled={!pricing}
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {success}
            </p>
          )}

          <Button
            fullWidth
            onClick={placeBid}
            disabled={!pricing || connecting || bidding}
          >
            {bidding ? "جاري الإرسال..." : "تأكيد المزايدة"}
          </Button>

          {!connected && connState === "error" && (
            <p className="text-center text-xs text-slate-500">
              يمكنك إعادة الاتصال أو استخدام المزايدة عبر الخادم عند فشل الاتصال الحي.
            </p>
          )}
        </div>
      </PageContainer>
    </>
  );
}
