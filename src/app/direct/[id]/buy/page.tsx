"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getListing, createOrder } from "@/services/marketplace";
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

  async function buy() {
    if (!requireAuth() || !user?.userId || !listing) return;
    if (!address.trim()) {
      setError("أدخل عنوان التسليم");
      return;
    }
    if (availQty <= 0) {
      setError("الكمية غير متاحة لهذا العرض");
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
      const orderId =
        (created as { orderId?: number })?.orderId ??
        (created as { id?: number })?.id;
      if (orderId) router.push(`/orders/direct/${orderId}`);
      else router.push("/orders/direct");
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
            <p className="mt-2 text-sm text-slate-600">
              الكمية: <span className="font-semibold">{availQty}</span> {listing.unit}
              <span className="mx-2 text-slate-400">·</span>
              يجب شراء العرض بالكامل
            </p>
            {(listing.farmCity || listing.governorateName) && (
              <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {listing.farmCity || listing.governorateName}
              </p>
            )}
          </div>
          <Input
            label="عنوان التسليم"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المدينة، الحي، تفاصيل الوصول..."
          />
          {total > 0 && (
            <p className="text-center text-lg font-bold text-slate-800">
              الإجمالي: {formatPrice(total)} ل.س
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={buy} disabled={loading || availQty <= 0}>
            {loading ? "جاري التأكيد..." : "تأكيد الطلب"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
