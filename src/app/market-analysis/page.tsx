"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MarketChartHeader } from "@/components/market-chart/MarketChartHeader";
import { SupplyDemandStrip } from "@/components/market-chart/SupplyDemandStrip";
import { useMarketChartData } from "@/hooks/useMarketChartData";
import {
  getChartDateRange,
  getChartGovernorates,
  getChartProducts,
} from "@/services/market-chart.api";
import type { ChartGroupBy, FilterGovernorate, FilterProduct } from "@/types/market-chart";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

const CandleVolumeChart = dynamic(
  () =>
    import("@/components/market-chart/CandleVolumeChart").then((m) => m.CandleVolumeChart),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> },
);

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-[#2a2e39]"
      style={{ height }}
    />
  );
}

export default function MarketChartPage() {
  const [products, setProducts] = useState<FilterProduct[]>([]);
  const [governorates, setGovernorates] = useState<FilterGovernorate[]>([]);
  const [productId, setProductId] = useState<number | undefined>();
  const [governorate, setGovernorate] = useState(0);
  const [groupBy, setGroupBy] = useState<ChartGroupBy>("day");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [minDate, setMinDate] = useState<string | undefined>();
  const [maxDate, setMaxDate] = useState<string | undefined>();

  useEffect(() => {
    Promise.all([getChartGovernorates(), getChartProducts()])
      .then(([govs, prods]) => {
        setGovernorates(govs);
        setProducts(prods);
        if (prods.length > 0 && !productId) {
          setProductId(prods[0].id);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!productId) return;
    getChartDateRange(productId, governorate)
      .then((range) => {
        const min = range.min ?? range.minDate;
        const max = range.max ?? range.maxDate;
        if (min) {
          setMinDate(min);
          if (!startDate) setStartDate(min.slice(0, 10));
        }
        if (max) {
          setMaxDate(max);
          if (!endDate) setEndDate(max.slice(0, 10));
        }
      })
      .catch(() => {});
  }, [productId, governorate, startDate, endDate]);

  const chartParams = useMemo(() => {
    if (!productId) return null;
    return {
      productId,
      governorate,
      groupBy,
      startDate,
      endDate,
    };
  }, [productId, governorate, groupBy, startDate, endDate]);

  const { data, loading, error, retry } = useMarketChartData(chartParams);

  const empty = !loading && data && data.candles.length === 0;

  return (
    <div className="min-h-screen bg-[#131722]" dir="rtl">
      <MarketChartHeader
        products={products}
        governorates={governorates}
        productId={productId}
        governorate={governorate}
        groupBy={groupBy}
        startDate={startDate}
        endDate={endDate}
        minDate={minDate}
        maxDate={maxDate}
        productName={data?.productName}
        lastPrice={data?.lastPrice}
        priceChange={data?.priceChange}
        volumeChange={data?.summary?.volumeChange}
        volatility={data?.volatility}
        loading={loading}
        onProductChange={setProductId}
        onGovernorateChange={setGovernorate}
        onGroupByChange={setGroupBy}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onRetry={retry}
      />

      <main className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {!productId && (
          <p className="py-16 text-center text-slate-400">اختر منتجاً لعرض المخطط</p>
        )}

        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-red-800/60 px-4 py-2 text-sm hover:bg-red-800"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {productId && loading && (
          <ChartSkeleton height={560} />
        )}

        {productId && !loading && empty && (
          <div className="rounded-xl border border-[#2a2e39] bg-[#1e222d] px-6 py-16 text-center">
            <p className="text-lg text-slate-300">لا توجد صفقات في هذه الفترة</p>
            <p className="mt-2 text-sm text-slate-500">
              جرّب توسيع الفترة أو تغيير المحافظة. إن كان السوق جديداً، قد يحتاج المسؤول لتشغيل
              backfill على الخادم.
            </p>
            <Link
              href="/market-analysis/overview"
              className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
            >
              العودة لنظرة عامة
            </Link>
          </div>
        )}

        {productId && !loading && data && data.candles.length > 0 && (
          <FadeIn>
            <section className="mb-2 overflow-hidden rounded-xl border border-[#2a2e39] bg-[#1e222d]">
              <CandleVolumeChart candles={data.candles} volume={data.volume} height={400} />
            </section>
            <p className="mb-4 text-center text-xs text-slate-500">
              الحجم (كغ) — أخضر: إغلاق ≥ افتتاح · أحمر: إغلاق &lt; افتتاح
            </p>
            <section className="rounded-xl border border-[#2a2e39] bg-[#1e222d] p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">
                نشاط السوق — عرض (بيع) مقابل طلب (شراء)
              </h2>
              <SupplyDemandStrip data={data.supplyDemand} />
            </section>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
