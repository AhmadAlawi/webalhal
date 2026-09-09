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
import { useI18n } from "@/context/I18nContext";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { MarketplaceListing } from "@/types";

export default function BuyDirectPage() {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getListing(Number(id))
      .then((l) => {
        setListing(l);
        const avail = Number(l?.availableQty ?? 0);
        const min = Number(l?.minOrderQty ?? 1) || 1;
        if (avail > 0) setQty(String(Math.max(min, avail)));
      })
      .catch(() => setListing(null));
  }, [id]);

  const availQty = Number(listing?.availableQty ?? 0);
  const minQty = Number(listing?.minOrderQty ?? 1) || 1;
  const maxQty = Number(listing?.maxOrderQty ?? availQty) || availQty;
  const unitPrice = Number(listing?.unitPrice ?? 0);
  const orderQty = Number(qty) || 0;
  const total = unitPrice > 0 && orderQty > 0 ? unitPrice * orderQty : 0;
  const isActive =
    String(listing?.status ?? "").toLowerCase() === "active" && availQty > 0;
  const unit = listing?.unit || t("forms.units.kg");

  async function buy() {
    if (!requireAuth() || !user?.userId || !listing) return;
    if (!address.trim()) {
      setError(t("direct.buy.enterAddress"));
      return;
    }
    if (!orderQty || orderQty < minQty) {
      setError(t("direct.buy.minQty", undefined, { qty: minQty }));
      return;
    }
    if (orderQty > availQty) {
      setError(t("direct.buy.availableQty", undefined, { qty: availQty }));
      return;
    }
    if (!isActive) {
      setError(t("direct.buy.notAvailable"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await createOrder({
        listingId: listing.listingId,
        buyerUserId: user.userId,
        qty: orderQty,
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
      setError(e instanceof Error ? e.message : t("direct.buy.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return (
      <>
        <PageHeader title={t("direct.buy.title")} backHref="/direct" />
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      </>
    );
  }

  const listingTitle =
    localized(listing as unknown as LocalizableRecord) || listing.title || listing.cropName;

  return (
    <>
      <PageHeader title={t("direct.buy.title")} backHref="/direct" />
      <PageContainer narrow className="py-8">
        <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <figure className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={getDirectMainImage(listing)}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </figure>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{listingTitle}</h2>
            {unitPrice > 0 ? (
              <p className="mt-2 text-lg font-bold text-emerald-600">
                {formatPrice(unitPrice)} {t("common.currency")} / {unit}
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-700">{t("direct.buy.priceUnavailable")}</p>
            )}
            {availQty > 0 ? (
              <p className="mt-1 text-sm text-slate-500">
                {t("direct.buy.available", undefined, { qty: formatPrice(availQty), unit })}
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-700">{t("direct.buy.qtyUnavailable")}</p>
            )}
          </div>
          {isActive && availQty > 0 && (
            <Input
              label={t("direct.buy.quantity", undefined, { unit })}
              type="number"
              min={minQty}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          )}
          <Input
            label={t("direct.buy.deliveryAddress")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("direct.buy.addressPlaceholder")}
            required
          />
          {total > 0 && isActive && (
            <p className="text-center text-sm text-slate-600">
              {t("direct.buy.total")}{" "}
              <span className="font-bold text-slate-900">
                {formatPrice(total)} {t("common.currency")}
              </span>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={buy} disabled={loading || !isActive}>
            {loading ? t("direct.buy.confirming") : t("direct.buy.confirmOrder")}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
