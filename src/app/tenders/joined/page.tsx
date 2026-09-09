"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ListingCard } from "@/components/cards/ListingCard";
import { getJoinedTenders } from "@/services/tenders";
import { getTenderMainImage } from "@/lib/media";
import { getTenderLocation } from "@/lib/marketplace";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import type { Tender } from "@/types";

export default function JoinedTendersPage() {
  const { t } = useI18n();
  const { user, requireAuth } = useAuth();
  const [items, setItems] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth() || !user?.userId) return;
    getJoinedTenders(user.userId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [requireAuth, user?.userId]);

  return (
    <>
      <PageHeader title={t("tenders.joinedTitle")} backHref="/account" />
      <PageContainer className="py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-slate-500">{t("tenders.joinedEmpty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tender) => (
              <ListingCard
                key={tender.tenderId}
                href={`/tenders/${tender.tenderId}`}
                title={tender.title || tender.cropName || t("tenders.tenderFallback", undefined, { id: tender.tenderId })}
                imageUrl={getTenderMainImage(tender)}
                price={tender.maxBudget}
                priceLabel={t("tenders.budget")}
                location={getTenderLocation(tender)}
                endTime={tender.endTime}
                badge={t("tenders.badge")}
              />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm">
          <Link href="/tenders" className="text-emerald-600 hover:underline">
            {t("tenders.browseAll")}
          </Link>
        </p>
      </PageContainer>
    </>
  );
}
