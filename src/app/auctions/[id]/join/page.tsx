"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Gavel, Wifi, WifiOff } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuctionEndedOverlay } from "@/components/auctions/AuctionEndedOverlay";
import { AuctionSuggestionsSidebar } from "@/components/auctions/AuctionSuggestionsSidebar";
import { AuctionWinnerChatButton } from "@/components/auctions/AuctionWinnerChatButton";
import { useAuth } from "@/context/AuthContext";
import {
  getAuction,
  getAuctionBids,
  getOpenAuctions,
  joinAuction,
  placeBidHttp,
  isAuctionJoinAccessError,
} from "@/services/auctions";
import { getAuctionMainImage } from "@/lib/media";
import {
  startAuctionHub,
  stopAuctionHub,
  parseHubError,
  invokeHubWhenConnected,
} from "@/lib/signalr";
import {
  formatPrice,
  getAuctionEndState,
  getMaxBidInput,
  getMinNextBid,
  isAuctionEndedPayload,
  isNearMaxPrice,
  parseAuctionPricing,
  resolvePlaceBidAmount,
  validateBid,
} from "@/lib/auctionPricing";
import type { Auction, AuctionPricing, Bid } from "@/types";

type ConnState = "idle" | "connecting" | "connected" | "reconnecting" | "error";

export default function AuctionJoinPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user, requireAuth, isAuthenticated } = useAuth();
  const auctionId = Number(id);
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const inviteFromUrl = searchParams.get("invite") ?? "";

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [suggested, setSuggested] = useState<Auction[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [bidding, setBidding] = useState(false);
  const [pricing, setPricing] = useState<AuctionPricing | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [inviteCode, setInviteCode] = useState(inviteFromUrl);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessBlocked, setAccessBlocked] = useState(false);

  const reloadBids = useCallback(() => {
    if (!auctionId) return;
    getAuctionBids(auctionId)
      .then((list) => setBids(Array.isArray(list) ? list : []))
      .catch(() => setBids([]));
  }, [auctionId]);

  useEffect(() => {
    if (success || error) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [success, error]);

  const applyPricing = useCallback((data: unknown, auctionHint?: Auction | null) => {
    const p = parseAuctionPricing(data);
    if (p) {
      setPricing(p);
      const ended = getAuctionEndState(auctionHint ?? null, p);
      if (!ended.ended) {
        setBidInput(String(getMinNextBid(p)));
      }
    }
    if (data && typeof data === "object") {
      const r = data as Record<string, unknown>;
      if (
        r.status != null ||
        r.lifecycleStatus != null ||
        r.isBiddable != null ||
        r.endTime != null
      ) {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                status: (r.status ?? r.Status ?? prev.status) as string | undefined,
                lifecycleStatus: (r.lifecycleStatus ??
                  r.LifecycleStatus ??
                  prev.lifecycleStatus) as string | undefined,
                isBiddable: (r.isBiddable ?? r.IsBiddable ?? prev.isBiddable) as
                  | boolean
                  | undefined,
                endTime: (r.endTime ?? r.EndTime ?? prev.endTime) as string | undefined,
              }
            : prev,
        );
      }
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
      applyPricing(data, auction);
      reloadBids();
      if (isAuctionEndedPayload(data)) {
        setStatus("انتهى المزاد");
        setSuccess("");
      } else {
        setStatus("تم تسجيل مزايدة جديدة على المزاد");
        const raw = data as Record<string, unknown> | null;
        if (raw && Number(raw.userId) === user?.userId) {
          setSuccess("تم تقديم عرضك بنجاح");
        }
      }
    },
    [applyPricing, auction, reloadBids],
  );

  const onAuctionUpdated = useCallback(
    (data: unknown) => {
      applyPricing(data, auction);
      if (isAuctionEndedPayload(data)) {
        setStatus("انتهى المزاد");
        setError("");
        setSuccess("");
      }
    },
    [applyPricing, auction],
  );

  useEffect(() => {
    if (!requireAuth() || !auctionId) return;
    getAuction(auctionId)
      .then((a) => {
        setAuction(a);
        if (a) applyPricing(a, a);
      })
      .catch(() => {});
    reloadBids();
  }, [auctionId, requireAuth, applyPricing, reloadBids]);

  useEffect(() => {
    if (!auctionId) return;
    const poll = () => {
      getAuction(auctionId)
        .then((a) => {
          if (!a) return;
          setAuction(a);
          applyPricing(a, a);
        })
        .catch(() => {});
    };
    const timer = setInterval(poll, 20_000);
    return () => clearInterval(timer);
  }, [auctionId, applyPricing]);

  useEffect(() => {
    setSuggestionsLoading(true);
    getOpenAuctions({ pageSize: "8", sortOrder: "desc" })
      .then((list) => setSuggested(list))
      .catch(() => setSuggested([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

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
          onAuctionUpdated,
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
        const price = await invokeHubWhenConnected(conn, "GetCurrentPrice", auctionId);
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
    onAuctionUpdated,
    applyPricing,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId || !auctionId) return;
    void connectHub();
    return () => {
      void stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
    };
  }, [auctionId, user?.userId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const endState = useMemo(
    () => getAuctionEndState(auction, pricing),
    [auction, pricing],
  );
  const auctionEnded = endState.ended;

  async function placeBid() {
    if (!user?.userId || !pricing) return;
    if (auctionEnded) {
      setError(endState.message);
      return;
    }
    const amount = Number(bidInput);
    const validationError = validateBid(pricing, amount);
    if (validationError) {
      setError(validationError);
      return;
    }
    const bidAmount = resolvePlaceBidAmount(pricing, amount);

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
        setSuccess("تم إرسال مزايدتك بنجاح ✓");
        setStatus("تم تسجيل مزايدتك على المزاد");
      } else {
        await placeBidHttp(auctionId, user.userId, bidAmount);
        setSuccess("تم إرسال مزايدتك بنجاح ✓");
        setStatus("تم تسجيل مزايدتك (اتصال حي غير متاح)");
      }
      const refreshed = await getAuction(auctionId).catch(() => null);
      if (refreshed) {
        setAuction(refreshed);
        applyPricing(refreshed, refreshed);
        if (getAuctionEndState(refreshed, parseAuctionPricing(refreshed)).ended) {
          setStatus("انتهى المزاد");
        }
      }
      reloadBids();
    } catch (e) {
      setError(parseHubError(e));
    } finally {
      setBidding(false);
    }
  }

  const connected = connState === "connected";
  const connecting = connState === "connecting" || connState === "reconnecting";
  const title =
    auction?.auctionTitle ||
    auction?.cropName ||
    auction?.productNameAr ||
    `مزاد #${auctionId}`;

  return (
    <>
      <PageHeader title="مزايدة حية" backHref={`/auctions/${id}`} />

      <PageContainer className="py-6 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* يمين في RTL: الصورة + المزايدة + سجل المزايدات */}
          <div className="relative mx-auto w-full max-w-xl space-y-6">
            {auctionEnded && auction && (
              <AuctionEndedOverlay message={endState.message}>
                <AuctionWinnerChatButton
                  auction={auction}
                  bids={bids}
                  userId={user?.userId}
                  sublabel="مبروك! فزت بهذا المزاد"
                  variant="primary"
                  className="w-full"
                />
              </AuctionEndedOverlay>
            )}

            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
              <Link
                href={`/auctions/${id}`}
                className="mt-1 inline-block text-sm text-emerald-700 hover:underline"
              >
                تفاصيل المزاد
              </Link>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-gray-100 bg-slate-50 shadow-md">
              <Image
                src={getAuctionMainImage(auction ?? {})}
                alt={title}
                fill
                className="object-cover"
                unoptimized
                priority
                sizes="(max-width: 640px) 100vw, 400px"
              />
            </div>

            <div
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm ${
                connected
                  ? "bg-emerald-50 text-emerald-700"
                  : connState === "reconnecting"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {connected ? (
                <Wifi className="h-4 w-4 shrink-0" />
              ) : (
                <WifiOff className="h-4 w-4 shrink-0" />
              )}
              {connState === "reconnecting"
                ? "إعادة الاتصال بالمزاد..."
                : status ||
                  (connecting ? "جاري الاتصال..." : connected ? "متصل" : "غير متصل")}
            </div>

            {!connected && (
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
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
              </div>
            )}

            {accessBlocked && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
                إذا كان المزاد خاصاً: اطلب الدخول من صفحة تفاصيل المزاد ثم أعد المحاولة برمز
                الدعوة.
              </p>
            )}

            {pricing && (
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-500">السعر الحالي</p>
                <p className="text-4xl font-bold text-emerald-600">
                  {formatPrice(pricing.currentPriceTotal)} ل.س
                </p>
                {pricing.currentPricePerUnit > 0 && (
                  <p className="mt-1 text-sm text-slate-500">
                    {formatPrice(pricing.currentPricePerUnit)} ل.س / {pricing.unit}
                  </p>
                )}
                {pricing.maxPriceTotal != null && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    السقف الأعلى: {formatPrice(pricing.maxPriceTotal)} ل.س
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {auctionEnded
                    ? endState.message
                    : isNearMaxPrice(pricing)
                      ? `قرب السقف — يمكن المزايدة بمبالغ صغيرة حتى ${formatPrice(getMaxBidInput(pricing) ?? pricing.maxPriceTotal ?? 0)} ل.س`
                      : `أقل مزايدة تالية: ${formatPrice(getMinNextBid(pricing))} ل.س`}
                </p>
              </div>
            )}

            <div
              className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${auctionEnded ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">تقديم مزايدة</h2>
              </div>
              <Input
                label="مبلغ المزايدة"
                type="number"
                value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
                disabled={!pricing || auctionEnded}
                min={pricing ? getMinNextBid(pricing) : undefined}
                max={pricing ? getMaxBidInput(pricing) ?? undefined : undefined}
                step={pricing && isNearMaxPrice(pricing) ? 1 : undefined}
              />

              <div ref={feedbackRef} className="mt-3 space-y-2">
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {success}
                  </p>
                )}
              </div>

              <Button
                fullWidth
                className="mt-4"
                size="lg"
                onClick={placeBid}
                disabled={!pricing || connecting || bidding || auctionEnded}
              >
                {bidding
                  ? "جاري إرسال المزايدة..."
                  : success
                    ? "إرسال مزايدة أخرى"
                    : "تأكيد المزايدة"}
              </Button>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">سجل المزايدات</h2>
              {bids.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">لا توجد مزايدات بعد</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {bids.map((b, i) => (
                    <li
                      key={b.bidId ?? i}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {b.bidderName || "مزايد"}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatPrice(b.bidAmount)} ل.س
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!connected && connState === "error" && (
              <p className="text-center text-xs text-slate-500">
                يمكنك إعادة الاتصال أو استخدام المزايدة عبر الخادم عند فشل الاتصال الحي.
              </p>
            )}
          </div>

          {/* يسار في RTL: مزادات مقترحة */}
          <AuctionSuggestionsSidebar
            auctions={suggested}
            loading={suggestionsLoading}
            currentAuctionId={auctionId}
          />
        </div>
      </PageContainer>
    </>
  );
}
