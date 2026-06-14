"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Gavel, Wifi, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuctionBiddersList } from "@/components/auctions/AuctionBiddersList";
import { AuctionEndedOverlay } from "@/components/auctions/AuctionEndedOverlay";
import { AuctionImageGallery } from "@/components/auctions/AuctionImageGallery";
import { AuctionSuggestionsSidebar } from "@/components/auctions/AuctionSuggestionsSidebar";
import { AuctionWinnerChatButton } from "@/components/auctions/AuctionWinnerChatButton";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import {
  getAuction,
  getAuctionBids,
  getOpenAuctions,
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
  getAuctionEndState,
  getMaxBidInput,
  getMinNextBid,
  isAuctionEndedPayload,
  isNearMaxPrice,
  parseAuctionPricing,
  resolvePlaceBidAmount,
  validateBid,
  type AuctionEndReason,
} from "@/lib/auctionPricing";
import type { LocalizableRecord } from "@/lib/localized-value";
import type { Auction, AuctionPricing, Bid } from "@/types";

type ConnState = "idle" | "connecting" | "connected" | "reconnecting" | "error";

type TranslateFn = (
  key: string,
  fallback?: string,
  values?: Record<string, string | number | null | undefined>,
) => string;

function translateAuctionEndMessage(reason: AuctionEndReason, t: TranslateFn): string {
  if (reason === "max_price") return t("auctions.endReasonMaxPrice");
  if (reason === "time") return t("auctions.endReasonTime");
  return t("auctions.ended");
}

function translateValidateBidError(
  msg: string | null,
  t: TranslateFn,
  pricing: AuctionPricing | null,
): string | null {
  if (!msg) return null;
  if (msg === "أدخل مبلغاً صالحاً") return t("auctions.bidInvalidAmount");
  if (msg === "انتهى المزاد — وُصل للسقف الأعلى") return t("auctions.endReasonMaxPrice");
  if (msg === "يجب أن يكون المبلغ أعلى من السعر الحالي") return t("auctions.bidMustExceedCurrent");
  if (msg === "تجاوزت السقف الأعلى للسعر") return t("auctions.bidExceedsMax");
  if (msg.startsWith("أقل مزايدة مقبولة:") && pricing) {
    return t("auctions.bidMinAccepted", "", {
      amount: `${formatPrice(getMinNextBid(pricing))} ${t("common.currency")}`,
    });
  }
  return msg;
}

function formatPriceWithCurrency(amount: number, t: TranslateFn): string {
  return `${formatPrice(amount)} ${t("common.currency")}`;
}

export default function AuctionJoinPage() {
  const { id } = useParams();
  const { user, requireAuth, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { marketTitle } = useLocalizedLabel();
  const auctionId = Number(id);
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [suggested, setSuggested] = useState<Auction[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [bidding, setBidding] = useState(false);
  const [pricing, setPricing] = useState<AuctionPricing | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        setStatus(t("auctions.ended"));
        setSuccess("");
      } else {
        setStatus(t("auctions.newBidRecorded"));
        const raw = data as Record<string, unknown> | null;
        if (raw && Number(raw.userId) === user?.userId) {
          setSuccess(t("auctions.yourBidSubmitted"));
        }
      }
    },
    [applyPricing, auction, reloadBids, t, user?.userId],
  );

  const onAuctionUpdated = useCallback(
    (data: unknown) => {
      applyPricing(data, auction);
      if (isAuctionEndedPayload(data)) {
        setStatus(t("auctions.ended"));
        setError("");
        setSuccess("");
      }
    },
    [applyPricing, auction, t],
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

    const code = null;
    connectingRef.current = true;
    setConnState("connecting");
    setError("");
    setSuccess("");

    if (connectionRef.current) {
      await stopAuctionHub(connectionRef.current, auctionId);
      connectionRef.current = null;
    }

    try {
      try {
        await joinAuction(auctionId, user.userId);
      } catch (joinErr) {
        if (isAuctionJoinAccessError(joinErr)) {
          setError(t("auctions.joinAccessDenied"));
        }
      }

      const conn = await startAuctionHub(
        auctionId,
        user.userId,
        code,
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
      setStatus(t("auctions.connectedLive"));
    } catch (e) {
      const msg = parseHubError(e);
      setError(msg || t("auctions.hubConnectFailed"));
      setConnState("error");
    } finally {
      connectingRef.current = false;
    }
  }, [
    auctionId,
    user?.userId,
    isAuthenticated,
    onPriceTick,
    onBidPlaced,
    onAuctionUpdated,
    applyPricing,
    t,
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
  const endMessage = auctionEnded
    ? translateAuctionEndMessage(endState.reason, t)
    : "";

  async function placeBid() {
    if (!user?.userId || !pricing) return;
    if (auctionEnded) {
      setError(endMessage);
      return;
    }
    const amount = Number(bidInput);
    const validationError = translateValidateBidError(validateBid(pricing, amount), t, pricing);
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
        setSuccess(t("auctions.yourBidSent"));
        setStatus(t("auctions.yourBidRegistered"));
      } else {
        await placeBidHttp(auctionId, user.userId, bidAmount);
        setSuccess(t("auctions.yourBidSent"));
        setStatus(t("auctions.yourBidRegisteredOffline"));
      }
      const refreshed = await getAuction(auctionId).catch(() => null);
      if (refreshed) {
        setAuction(refreshed);
        applyPricing(refreshed, refreshed);
        if (getAuctionEndState(refreshed, parseAuctionPricing(refreshed)).ended) {
          setStatus(t("auctions.ended"));
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
  const fromTitle = auction
    ? marketTitle(auction as unknown as LocalizableRecord, "auction", auctionId)
    : "";
  const title =
    fromTitle && fromTitle !== String(auctionId)
      ? fromTitle
      : t("auctions.auctionFallback", "", { id: auctionId });

  const connStatusLabel =
    connState === "reconnecting"
      ? t("auctions.reconnecting")
      : status ||
        (connecting
          ? t("auctions.connecting")
          : connected
            ? t("auctions.connected")
            : t("auctions.disconnected"));

  return (
    <>
      <PageHeader title={t("auctions.liveBidding")} backHref={`/auctions/${id}`} />

      <AuctionImageGallery auction={auction} title={title} />

      <PageContainer className="py-6 lg:py-8">
        <div className="mb-6 text-center lg:text-right">
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
          <Link
            href={`/auctions/${id}`}
            className="mt-1 inline-block text-sm text-emerald-700 hover:underline"
          >
            {t("auctions.viewAuctionDetails")}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
          <div className="relative order-2 space-y-6 lg:order-1">
            {auctionEnded && auction && (
              <AuctionEndedOverlay message={endMessage}>
                <AuctionWinnerChatButton
                  auction={auction}
                  bids={bids}
                  userId={user?.userId}
                  sublabel={t("auctions.winnerCongrats")}
                  variant="primary"
                  className="w-full"
                />
              </AuctionEndedOverlay>
            )}

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
              {connStatusLabel}
            </div>

            {!connected && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  disabled={connecting}
                  onClick={() => void connectHub()}
                >
                  {connecting ? t("auctions.connecting") : t("auctions.reconnect")}
                </Button>
              </div>
            )}

            {pricing && (
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-500">{t("auctions.currentPrice")}</p>
                <p className="text-4xl font-bold text-emerald-600">
                  {formatPriceWithCurrency(pricing.currentPriceTotal, t)}
                </p>
                {pricing.currentPricePerUnit > 0 && (
                  <p className="mt-1 text-sm text-slate-500">
                    {t("auctions.pricePerUnit", "", {
                      price: formatPriceWithCurrency(pricing.currentPricePerUnit, t),
                      unit: pricing.unit,
                    })}
                  </p>
                )}
                {pricing.maxPriceTotal != null && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {t("auctions.maxPriceLabel", "", {
                      price: formatPriceWithCurrency(pricing.maxPriceTotal, t),
                    })}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {auctionEnded
                    ? endMessage
                    : isNearMaxPrice(pricing)
                      ? t("auctions.nearMaxHint", "", {
                          price: formatPriceWithCurrency(
                            getMaxBidInput(pricing) ?? pricing.maxPriceTotal ?? 0,
                            t,
                          ),
                        })
                      : t("auctions.nextMinBid", "", {
                          price: formatPriceWithCurrency(getMinNextBid(pricing), t),
                        })}
                </p>
              </div>
            )}

            <div
              className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${auctionEnded ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">{t("auctions.placeBid")}</h2>
              </div>
              <Input
                label={t("auctions.bidAmount")}
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
                  ? t("auctions.submittingBid")
                  : success
                    ? t("auctions.submitAnotherBid")
                    : t("auctions.confirmBid")}
              </Button>
            </div>

            {!connected && connState === "error" && (
              <p className="text-center text-xs text-slate-500">{t("auctions.offlineBidHint")}</p>
            )}

            <AuctionSuggestionsSidebar
              auctions={suggested}
              loading={suggestionsLoading}
              currentAuctionId={auctionId}
            />
          </div>

          <AuctionBiddersList bids={bids} className="order-1 lg:order-2" />
        </div>
      </PageContainer>
    </>
  );
}
