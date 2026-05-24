"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getListing, createOrder } from "@/services/marketplace";
import { parseOrderFromCreate } from "@/services/direct";
import { getDirectMainImage } from "@/lib/media";
import { formatPrice } from "@/lib/auctionPricing";
import { useAuth } from "@/context/AuthContext";
import type { MarketplaceListing } from "@/types";

export default function BuyDirectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getListing(Number(id))
      .then(setListing)
      .catch(() => setListing(null));
  }, [id]);

  const availQty = Number(listing?.availableQty ?? 0);
  const unitPrice = Number(listing?.unitPrice ?? 0);
  const total = unitPrice * availQty;
  const isActive =
    String(listing?.status ?? "").toLowerCase() === "active" && availQty > 0;

  async function buy() {
    if (!requireAuth() || !user?.userId || !listing) return;
    if (!address.trim()) {
      setError("أدخل عنوان التسليم");
      return;
    }
    if (!isActive) {
      setError("هذا العرض غير متاح للشراء حالياً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await createOrder({
        listingId: listing.listingId,
        buyerUserId: user.userId,
        qty: availQty,
        deliveryAddress: address.trim(),
        paymentMethod: "cash",
      });
      const parsed = parseOrderFromCreate(created);
      const orderId = parsed.orderId;
      const chatId = parsed.chatId;

      if (chatId) {
        router.push(`/chat/${chatId}`);
      } else if (orderId) {
        router.push(`/orders/direct/${orderId}`);
      } else {
        router.push("/orders/direct");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return (
      <>
        <PageHeader title="شراء" backHref="/direct" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader title="شراء" backHref="/direct" />
      <PageContainer narrow className="py-8">
        <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <figure className="relative aspect-video overflow-hidden rounded-2xl">
            <Image
              src={getDirectMainImage(listing)}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </figure>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {listing.title || listing.cropName}
            </h2>
            <p className="mt-2 text-lg font-bold text-emerald-600">
              {formatPrice(unitPrice)} ل.س / {listing.unit}
            </p>
            {!isActive && (
              <p className="mt-2 text-sm text-amber-700">هذا العرض غير متاح للشراء</p>
            )}
          </div>
          <Input
            label="عنوان التسليم"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المدينة، الحي، تفاصيل الوصول..."
            required
          />
          {total > 0 && isActive && (
            <p className="text-center text-sm text-slate-600">
              شراء كامل العرض ({availQty} {listing.unit}) — الإجمالي{" "}
              <span className="font-bold text-slate-900">{formatPrice(total)} ل.س</span>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={buy} disabled={loading || !isActive}>
            {loading ? "جاري التأكيد..." : "تأكيد الطلب"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
