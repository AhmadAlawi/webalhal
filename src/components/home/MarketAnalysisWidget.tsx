"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  getAnalysisFiltersAvailable,
  getTopProductsByRevenue,
} from "@/services/market-analysis";
import { formatCurrency } from "@/lib/format";
import type { TopProductSales } from "@/types/market-analysis";

const FALLBACK_GOVERNORATES = [
  { id: 1, nameAr: "عمّان" },
  { id: 2, nameAr: "إربد" },
  { id: 3, nameAr: "الزرقاء" },
  { id: 4, nameAr: "البلقاء" },
];

const PRODUCT_IMAGES = [
  "/placeholder-crop.svg",
  "/placeholder-crop.svg",
  "/placeholder-crop.svg",
];

function TrendLine({ direction = "up" }: { direction?: "up" | "down" }) {
  const points =
    direction === "up"
      ? "4,34 28,26 52,28 76,14 100,20 124,8"
      : "4,16 28,20 52,18 76,28 100,34 124,42";
  return (
    <svg viewBox="0 0 128 48" className="h-12 w-36" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="#FF9900"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarketAnalysisWidget() {
  const [products, setProducts] = useState<TopProductSales[]>([]);
  const [governorates, setGovernorates] = useState(FALLBACK_GOVERNORATES);
  const [activeGov, setActiveGov] = useState<number>(FALLBACK_GOVERNORATES[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysisFiltersAvailable()
      .then((filters) => {
        const next = (filters.governorates ?? [])
          .filter((g) => g.id && (g.nameAr || g.name))
          .slice(0, 4)
          .map((g) => ({ id: g.id, nameAr: g.nameAr || g.name || "" }));
        if (next.length) {
          setGovernorates(next);
          setActiveGov(next[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTopProductsByRevenue({ topN: 3, days: 30, governorateId: activeGov })
      .then((rows) => {
        if (!cancelled) setProducts(rows.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGov]);

  const visibleProducts = useMemo(() => {
    if (products.length) return products;
    return [
      { productName: "إجاص", totalRevenue: 0, totalVolume: 0 },
      { productName: "باذنجان", totalRevenue: 0, totalVolume: 0 },
      { productName: "بازلاء", totalRevenue: 0, totalVolume: 0 },
    ] satisfies TopProductSales[];
  }, [products]);

  return (
    <section className="border-y border-[#D7D9E2] bg-white py-10">
      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <FadeIn className="rounded-lg bg-[#00066D] p-6 text-white shadow-[0_18px_46px_rgba(0,6,109,0.16)]">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-extrabold text-[#FF9900]">
                <span className="h-2 w-2 rounded-full bg-[#FF9900]" />
                مباشر الآن
              </span>
              <BarChart3 className="h-7 w-7 text-[#FF9900]" />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold">تحليلات السوق</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/72">
              مؤشرات المنتجات الأكثر حركة حسب المحافظات الأردنية.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {governorates.map((gov) => {
                const active = activeGov === gov.id;
                return (
                  <button
                    key={gov.id}
                    type="button"
                    onClick={() => setActiveGov(gov.id)}
                    className={`rounded-lg px-4 py-3 text-right text-sm font-extrabold transition ${
                      active
                        ? "bg-[#FF9900] text-[#00066D]"
                        : "bg-white/10 text-white/75 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {gov.nameAr}
                  </button>
                );
              })}
            </div>

            <Link
              href="/market-analysis"
              className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-[#00066D] transition hover:bg-[#FFF3DC]"
            >
              التحليلات الكاملة
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          <div>
            <FadeIn className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#8B5A00]">الأكثر تداولاً</p>
                <h3 className="mt-1 text-2xl font-extrabold text-[#00066D] md:text-3xl">
                  مؤشرات المنتجات
                </h3>
              </div>
              {loading && (
                <p className="text-sm font-semibold text-[#777B8F]">جاري تحديث المؤشرات...</p>
              )}
            </FadeIn>

            <div className="grid gap-5 md:grid-cols-3">
              {visibleProducts.map((product, index) => {
                const title =
                  product.productName ||
                  product.name ||
                  `منتج #${product.productId ?? index + 1}`;
                const value = product.totalRevenue ?? product.totalVolume ?? 0;
                return (
                  <FadeIn key={`${title}-${index}`} delay={index * 0.05}>
                    <Link
                      href="/market-analysis"
                      className="flex h-full flex-col rounded-lg border border-[#D7D9E2] bg-[#F7F8FB] p-4 shadow-[0_12px_28px_rgba(0,6,109,0.06)] transition hover:-translate-y-1 hover:border-[#00066D]/20 hover:bg-white hover:shadow-[0_18px_38px_rgba(0,6,109,0.10)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white">
                        <Image
                          src={PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 320px"
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-4 flex flex-1 flex-col">
                        <h4 className="line-clamp-1 text-xl font-extrabold text-[#00066D]">
                          {title}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-[#777B8F]">محصول</p>
                        <div className="mt-auto pt-5">
                          <p className="text-2xl font-extrabold text-[#8B5A00]">
                            {value ? formatCurrency(value) : "— JD"}
                          </p>
                          <TrendLine direction={index === 2 ? "down" : "up"} />
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
