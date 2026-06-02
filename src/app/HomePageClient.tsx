"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { BottomAdStrip } from "@/components/home/BottomAdStrip";
import { MarketTabs, type MarketTab } from "@/components/home/MarketTabs";
import { MarketListings } from "@/components/home/MarketListings";
import { ServicesSection } from "@/components/home/ServicesSection";
import { PageContainer } from "@/components/layout/PageContainer";
import { useCategories } from "@/hooks/useCategories";
import { getAppAds, getBottomAds } from "@/services/catalog";
import type { Advertisement } from "@/types";

const MarketAnalysisWidget = dynamic(
  () =>
    import("@/components/home/MarketAnalysisWidget").then((m) => m.MarketAnalysisWidget),
  {
    ssr: false,
    loading: () => (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    ),
  },
);

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MarketTab>("auctions");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [topAds, setTopAds] = useState<Advertisement[]>([]);
  const [bottomAds, setBottomAds] = useState<Advertisement[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const fromUrl = searchParams.get("categoryId");
    if (fromUrl) {
      const id = Number(fromUrl);
      if (Number.isFinite(id) && id > 0) setCategoryId(id);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setAdsLoading(true);
    Promise.all([getAppAds(), getBottomAds()])
      .then(([top, bottom]) => {
        if (cancelled) return;
        setTopAds(top);
        setBottomAds(bottom);
      })
      .catch(() => {
        if (!cancelled) {
          setTopAds([]);
          setBottomAds([]);
        }
      })
      .finally(() => {
        if (!cancelled) setAdsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <BannerCarousel ads={topAds} loading={adsLoading} />

      <section className="border-b border-slate-200/60 bg-white py-6">
        <PageContainer>
          <div className="relative w-full">
            <Search className="absolute top-1/2 end-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="ابحث عن محصول، مزاد، أو مناقصة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full py-3.5 pe-12 ps-4"
            />
          </div>
        </PageContainer>
      </section>

      {categories.length > 0 && (
        <section className="border-b border-slate-100 bg-white py-4">
          <PageContainer>
            <p className="mb-2 text-sm font-semibold text-slate-700">التصنيفات</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId(undefined)}
                className={`chip ${!categoryId ? "chip-active" : "chip-inactive"}`}
              >
                الكل
              </button>
              {categories.map((c) => (
                <button
                  key={c.categoryId}
                  type="button"
                  onClick={() => setCategoryId(c.categoryId)}
                  className={`chip ${
                    categoryId === c.categoryId ? "chip-active" : "chip-inactive"
                  }`}
                >
                  {c.nameAr || c.name}
                </button>
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      <ServicesSection />

      <section className="py-10">
        <PageContainer>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">عروض السوق</h2>
              <p className="text-slate-500">أحدث المزادات والمناقصات والبيع المباشر</p>
            </div>
            <MarketTabs active={tab} onChange={setTab} />
          </div>
          <MarketListings tab={tab} searchQuery={search} categoryId={categoryId} />
        </PageContainer>
      </section>

      <MarketAnalysisWidget />

      <BottomAdStrip ads={bottomAds} />
    </>
  );
}
