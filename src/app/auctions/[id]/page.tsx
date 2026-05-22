"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuction, getAuctionBids, requestAuctionAccess } from "@/services/auctions";
import { getAuctionMainImage } from "@/lib/media";
import { formatPrice } from "@/lib/auctionPricing";
import { useAuth } from "@/context/AuthContext";
import { canJoinAuction } from "@/lib/permissions";
import type { Auction, Bid } from "@/types";

export default function AuctionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [accessMsg, setAccessMsg] = useState("");
  const [accessErr, setAccessErr] = useState("");

  useEffect(() => {
    const auctionId = Number(id);
    if (!auctionId) return;
    getAuction(auctionId).then(setAuction).catch(() => {});
    getAuctionBids(auctionId).then(setBids).catch(() => setBids([]));
  }, [id]);

  if (!auction) {
    return (
      <>
        <PageHeader title="تفاصيل المزاد" backHref="/auctions" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  const isOwner = user?.userId === auction.createdByUserId;

  async function requestAccess() {
    if (!requireAuth() || !user?.userId) return;
    setAccessErr("");
    setAccessMsg("");
    try {
      await requestAuctionAccess(Number(id), user.userId);
      setAccessMsg("تم إرسال طلب الدخول — انتظر موافقة صاحب المزاد");
    } catch (e) {
      setAccessErr(e instanceof Error ? e.message : "فشل طلب الدخول");
    }
  }

  return (
    <>
      <PageHeader title={auction.auctionTitle || auction.cropName || "مزاد"} backHref="/auctions" />
      <PageContainer className="py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 lg:aspect-auto lg:min-h-[400px]">
            <Image
              src={getAuctionMainImage(auction)}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">
                {auction.auctionTitle || auction.cropName}
              </h2>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {formatPrice(auction.currentPrice ?? auction.startingPrice ?? 0)} ل.س
              </p>
              {auction.endTime && (
                <p className="mt-2 text-slate-500">
                  ينتهي: {new Date(auction.endTime).toLocaleString("ar-SY")}
                </p>
              )}
            </div>
            {!isOwner && canJoinAuction(user?.roleId) && (
              <div className="space-y-3">
                <Button type="button" variant="outline" fullWidth onClick={requestAccess}>
                  طلب دخول (مزاد خاص)
                </Button>
                {accessMsg && <p className="text-sm text-emerald-700">{accessMsg}</p>}
                {accessErr && <p className="text-sm text-red-600">{accessErr}</p>}
                <Input
                  label="كود الدعوة (مزاد خاص — اختياري)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="اتركه فارغاً للمزاد العام"
                />
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    if (!requireAuth()) return;
                    const q = inviteCode.trim()
                      ? `?invite=${encodeURIComponent(inviteCode.trim())}`
                      : "";
                    router.push(`/auctions/${id}/join${q}`);
                  }}
                >
                  دخول المزاد والمزايدة
                </Button>
              </div>
            )}
            {isOwner && (
              <div className="space-y-3">
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
                  أنت صاحب هذا المزاد
                </p>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => router.push(`/auctions/${id}/edit`)}
                >
                  تعديل المزاد
                </Button>
              </div>
            )}
            {bids.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="mb-4 font-semibold text-slate-900">آخر المزايدات</h3>
                <ul className="space-y-2">
                  {bids.slice(0, 8).map((b, i) => (
                    <li
                      key={i}
                      className="flex justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm"
                    >
                      <span>{b.bidderName || "مزايد"}</span>
                      <span className="font-semibold text-emerald-700">
                        {formatPrice(b.bidAmount)} ل.س
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
