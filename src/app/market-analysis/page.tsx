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
import { useI18n } from "@/context/I18nContext";

const CandleVolumeChart = dynamic(
  () =>
    import("@/components/market-chart/CandleVolumeChart").then((m) => m.CandleVolumeChart),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> },
);

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="skeleton-shimmer animate-pulse rounded-xl"
      style={{ height }}
    />
  );
}

export default function MarketChartPage() {
  const { t, direction } = useI18n();
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
          setProductId(prods[0].productId);
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
    <div className="min-h-screen" dir={direction}>
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
          <p className="py-16 text-center text-slate-400">{t("marketChart.selectProductPrompt")}</p>
        )}

        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              {t("marketChart.retry")}
            </button>
          </div>
        )}

        {productId && loading && (
          <ChartSkeleton height={560} />
        )}

        {productId && !loading && empty && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">{t("marketChart.noTradesInPeriod")}</p>
            <p className="mt-2 text-sm text-slate-500">{t("marketChart.emptyPeriodHint")}</p>
            <Link
              href="/market-analysis/overview"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline"
            >
              {t("marketChart.backToOverview")}
            </Link>
          </div>
        )}

        {productId && !loading && data && data.candles.length > 0 && (
          <FadeIn>
            <section className="mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <CandleVolumeChart candles={data.candles} volume={data.volume} height={400} />
            </section>
            <p className="mb-4 text-center text-xs text-slate-500">{t("marketChart.volumeLegend")}</p>
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                {t("marketChart.supplyDemandTitle")}
              </h2>
              <SupplyDemandStrip data={data.supplyDemand} />
            </section>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
