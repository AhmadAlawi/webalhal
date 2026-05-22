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
  const [qty, setQty] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getListing(Number(id))
      .then((l) => {
        setListing(l);
        setQty(String(l.availableQty ?? 1));
      })
      .catch(() => setListing(null));
  }, [id]);

  async function buy() {
    if (!requireAuth() || !user?.userId || !listing) return;
    if (!address.trim()) {
      setError("أدخل عنوان التسليم");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createOrder({
        listingId: listing.listingId,
        buyerUserId: user.userId,
        qty: Number(qty),
        deliveryAddress: address.trim(),
        paymentMethod: "كاش",
      });
      router.push("/orders/direct");
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

  const total = (listing.unitPrice ?? 0) * Number(qty || 0);

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
              {formatPrice(listing.unitPrice ?? 0)} ل.س / {listing.unit}
            </p>
            {(listing.farmCity || listing.governorateName) && (
              <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {listing.farmCity || listing.governorateName}
              </p>
            )}
          </div>
          <Input
            label="الكمية"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            label="عنوان التسليم"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {total > 0 && (
            <p className="text-center text-lg font-bold text-slate-800">
              الإجمالي التقريبي: {formatPrice(total)} ل.س
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={buy} disabled={loading}>
            {loading ? "جاري التأكيد..." : "تأكيد الطلب"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
