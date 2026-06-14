"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, FileText, Gavel, PlusCircle, Search, ShoppingBasket } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { BottomAdStrip } from "@/components/home/BottomAdStrip";
import { MarketTabs, type MarketTab } from "@/components/home/MarketTabs";
import { MarketListings } from "@/components/home/MarketListings";
import { PageContainer } from "@/components/layout/PageContainer";
import { getBottomAds, getMobileHeaderAds } from "@/services/catalog";
import type { Advertisement } from "@/types";

const VIEW_ALL_ROUTES: Record<MarketTab, string> = {
  auctions: "/auctions",
  tenders: "/tenders",
  direct: "/direct",
};

const MARKET_SHORTCUTS = [
  {
    href: "/auctions",
    label: "المزادات",
    detail: "زايد على المحاصيل المتاحة",
    icon: Gavel,
  },
  {
    href: "/tenders",
    label: "المناقصات",
    detail: "طلبات شراء من التجار",
    icon: FileText,
  },
  {
    href: "/direct",
    label: "البيع المباشر",
    detail: "عروض جاهزة للشراء",
    icon: ShoppingBasket,
  },
];

const MarketAnalysisWidget = dynamic(
  () =>
    import("@/components/home/MarketAnalysisWidget").then((m) => m.MarketAnalysisWidget),
  {
    ssr: false,
    loading: () => (
      <section className="bg-[#F7F8FB] px-4 py-10">
        <div className="mx-auto h-64 max-w-[680px] animate-pulse rounded-lg bg-[#EEF0F3]" />
      </section>
    ),
  },
);

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MarketTab>("auctions");
  const [search, setSearch] = useState("");
  const [topAds, setTopAds] = useState<Advertisement[]>([]);
  const [bottomAds, setBottomAds] = useState<Advertisement[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  const categoryId = useMemo(() => {
    const fromUrl = searchParams.get("categoryId");
    if (fromUrl) {
      const id = Number(fromUrl);
      if (Number.isFinite(id) && id > 0) return id;
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMobileHeaderAds(categoryId), getBottomAds()])
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
  }, [categoryId]);

  return (
    <>
      <section id="home-search" className="border-b border-[#D7D9E2] bg-[#F7F8FB] py-5 md:py-8 lg:py-10">
        <PageContainer>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className="rounded-lg border border-[#D7D9E2] bg-white p-5 shadow-[0_18px_46px_rgba(0,6,109,0.08)] md:p-7 lg:p-8">
              <div className="flex flex-col gap-5 lg:min-h-[320px] lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFF3DC] px-4 py-2 text-sm font-extrabold text-[#8B5A00]">
                    <span className="h-2 w-2 rounded-full bg-[#FF9900]" />
                    سوق الهال الأردني
                  </div>
                  <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-[#00066D] md:text-5xl">
                    مزادات ومناقصات وعروض مباشرة في مكان واحد
                  </h1>
                  <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#777B8F] md:text-lg">
                    تابع حركة السوق في الأردن، وابحث عن المحصول أو العرض المناسب بسرعة من لوحة الويب.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute top-1/2 end-4 h-5 w-5 -translate-y-1/2 text-[#00066D]" />
                    <input
                      type="search"
                      placeholder="ابحث عن محصول، مزاد، أو مناقصة..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-[#D7D9E2] bg-[#F7F8FB] py-4 pe-12 ps-4 text-right text-base font-semibold text-[#00066D] outline-none transition placeholder:text-[#8D90A0] focus:border-[#00066D] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,6,109,0.10)]"
                    />
                  </div>
                  <MarketTabs active={tab} onChange={setTab} />
                </div>
              </div>
            </div>

            <aside className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <Link
                href="/market-analysis"
                className="group flex min-h-[130px] flex-col justify-between rounded-lg bg-[#00066D] p-5 text-white shadow-[0_18px_42px_rgba(0,6,109,0.20)] transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-white/75">تحليلات مباشرة</span>
                  <BarChart3 className="h-6 w-6 text-[#FF9900]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold">أسعار السوق</p>
                  <p className="mt-1 text-sm font-semibold text-white/70">حسب المحافظات والمنتجات</p>
                </div>
              </Link>

              {MARKET_SHORTCUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-[104px] items-center gap-4 rounded-lg border border-[#D7D9E2] bg-white p-4 shadow-[0_12px_30px_rgba(0,6,109,0.06)] transition hover:-translate-y-1 hover:border-[#00066D]/20"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FFF3DC] text-[#8B5A00]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-extrabold text-[#00066D]">{item.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-[#777B8F]">{item.detail}</span>
                    </span>
                  </Link>
                );
              })}

              <Link
                href="/direct/new"
                className="hidden min-h-[104px] items-center justify-center gap-3 rounded-lg border border-dashed border-[#FF9900] bg-[#FFF9EF] p-4 text-base font-extrabold text-[#8B5A00] transition hover:bg-[#FFF3DC] md:flex lg:hidden"
              >
                <PlusCircle className="h-5 w-5" />
                عرض بيع جديد
              </Link>
            </aside>
          </div>
        </PageContainer>
      </section>

      <BannerCarousel ads={topAds} loading={adsLoading} />

      <section className="bg-[#F7F8FB] py-8 md:py-10">
        <PageContainer>
          <div className="mx-auto max-w-[680px] md:max-w-7xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-extrabold text-[#8B5A00]">مختارة من السوق</p>
                <h2 className="text-3xl font-extrabold text-[#00066D] md:text-4xl">فرص ذات أولوية</h2>
              </div>
              <Link
                href={VIEW_ALL_ROUTES[tab]}
                className="rounded-full border border-[#D7D9E2] bg-white px-5 py-2.5 text-base font-bold text-[#00066D] shadow-sm transition hover:border-[#FF9900] hover:text-[#8B5A00]"
              >
                عرض الكل
              </Link>
            </div>
            <MarketListings tab={tab} searchQuery={search} categoryId={categoryId} />
          </div>
        </PageContainer>
      </section>

      <MarketAnalysisWidget />

      <BottomAdStrip ads={bottomAds} />
    </>
  );
}
