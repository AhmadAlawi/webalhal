"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { KpiCardView } from "@/components/analysis/KpiCardView";
import { SyriaMarketMapDynamic } from "@/components/maps/SyriaMarketMapDynamic";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";

const MiniSparkline = dynamic(
  () => import("@/components/analysis/MiniSparkline").then((m) => m.MiniSparkline),
  { ssr: false, loading: () => <div className="h-12 animate-pulse rounded bg-slate-100" /> },
);
const InteractiveBarChart = dynamic(
  () =>
    import("@/components/analysis/charts/InteractiveBarChart").then((m) => m.InteractiveBarChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> },
);
const InteractiveAreaChart = dynamic(
  () =>
    import("@/components/analysis/charts/InteractiveAreaChart").then((m) => m.InteractiveAreaChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> },
);
const InteractivePieChart = dynamic(
  () =>
    import("@/components/analysis/charts/InteractivePieChart").then((m) => m.InteractivePieChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> },
);
import { FadeIn } from "@/components/motion/FadeIn";
import { mergeGovernorateMapPoints, toMapVolumePoints } from "@/lib/syria-governorates";
import {
  getAnalysisFiltersAvailable,
  getDashboardSummary,
  getPriceTrendsChart,
  getTopProductsByRevenue,
  getTransactionTypeDistribution,
  getVolumeByGovernorate,
} from "@/services/market-analysis";
import type {
  AnalysisFiltersAvailable,
  DashboardSummaryData,
  MarketAnalysisFilters,
  PriceTrendsChartData,
} from "@/types/market-analysis";
import { formatCurrency, formatDateAr } from "@/lib/format";
import type { ChartSlice, TopProductSales, VolumeByGovernorate } from "@/types/market-analysis";
import { BarChart2, Map } from "lucide-react";

export default function MarketAnalysisOverviewPage() {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const [filtersMeta, setFiltersMeta] = useState<AnalysisFiltersAvailable | null>(null);
  const [governorateId, setGovernorateId] = useState<number | undefined>();
  const [productId, setProductId] = useState<number | undefined>();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrendsChartData | null>(null);
  const [txDist, setTxDist] = useState<ChartSlice[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductSales[]>([]);
  const [volumeGov, setVolumeGov] = useState<VolumeByGovernorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedGov = useDebounce(governorateId, 300);
  const debouncedProduct = useDebounce(productId, 300);
  const debouncedDays = useDebounce(days, 300);

  const query: MarketAnalysisFilters = {
    governorateId: debouncedGov,
    productId: debouncedProduct,
    days: debouncedDays,
  };

  const transactionTypeLabel = useCallback(
    (key: string) => {
      const normalized = key.toLowerCase().trim();
      return t(`analysis.transactionTypes.${normalized}`, normalized);
    },
    [t],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, pt, tx, tp, vg] = await Promise.all([
        getDashboardSummary(query),
        getPriceTrendsChart(query),
        getTransactionTypeDistribution(query),
        getTopProductsByRevenue({ ...query, topN: 8 }),
        getVolumeByGovernorate(query),
      ]);
      setSummary(s);
      setPriceTrends(pt);
      setTxDist(tx);
      setTopProducts(tp);
      setVolumeGov(vg);
    } catch {
      setError(t("analysis.loadError"));
    } finally {
      setLoading(false);
    }
  }, [debouncedGov, debouncedProduct, debouncedDays, t]);

  useEffect(() => {
    getAnalysisFiltersAvailable().then(setFiltersMeta).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const priceLine =
    priceTrends?.averagePrice?.map((p) => ({
      label: formatDateAr(p.date),
      value: p.value ?? 0,
    })) ?? [];

  const mapPoints = useMemo(() => {
    const govMeta = filtersMeta?.governorates?.map((g) => ({
      governorateId: g.id,
      nameAr: g.nameAr ?? g.name,
    }));
    const points = toMapVolumePoints(volumeGov, govMeta);
    return points.length ? mergeGovernorateMapPoints(points) : points;
  }, [volumeGov, filtersMeta?.governorates]);

  return (
    <>
      <PageHeader title={t("analysis.overviewTitle")} backHref="/" />
      <PageContainer className="py-6">
        <Link
          href="/market-analysis"
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <BarChart2 className="h-4 w-4" />
          {t("analysis.productChartCta")}
        </Link>
      </PageContainer>

      <PageContainer className="pb-8">
        <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("analysis.governorate")}</span>
            <select
              className="min-w-[160px] rounded-lg border border-gray-200 px-3 py-2"
              value={governorateId ?? ""}
              onChange={(e) =>
                setGovernorateId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">{t("common.all")}</option>
              {filtersMeta?.governorates
                ?.filter((g): g is NonNullable<typeof g> => g != null && g.id != null)
                .map((g) => (
                <option key={g.id} value={g.id}>
                  {localized(g, "name")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("analysis.product")}</span>
            <select
              className="min-w-[180px] rounded-lg border border-gray-200 px-3 py-2"
              value={productId ?? ""}
              onChange={(e) =>
                setProductId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">{t("common.all")}</option>
              {filtersMeta?.products
                ?.filter((p): p is NonNullable<typeof p> => p != null && p.id != null)
                .map((p) => (
                <option key={p.id} value={p.id}>
                  {localized(p, "name")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">{t("analysis.period")}</span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>{t("analysis.period7Days")}</option>
              <option value={30}>{t("analysis.period30Days")}</option>
              <option value={90}>{t("analysis.period90Days")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t("analysis.apply")}
          </button>
        </div>

        {error && <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-slate-900">{t("analysis.overviewSection")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCardView kpi={summary?.totalRevenue} isCurrency />
                <KpiCardView kpi={summary?.totalVolume} />
                <KpiCardView kpi={summary?.totalTransactions} />
                <KpiCardView kpi={summary?.averagePrice} isCurrency />
                <KpiCardView kpi={summary?.activeProducts} />
                <KpiCardView kpi={summary?.topGovernorate} />
              </div>
              {summary?.revenueSparkline && summary.revenueSparkline.length > 0 && (
                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-slate-800">{t("analysis.revenueTrend")}</h3>
                  <MiniSparkline points={summary.revenueSparkline} />
                </div>
              )}
            </section>
            <FadeIn className="mb-10">
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                  <Map className="h-5 w-5 text-emerald-600" />
                  {t("analysis.mapTitle")}
                </h3>
                <SyriaMarketMapDynamic points={mapPoints} height={400} />
              </section>
            </FadeIn>

            <div className="grid gap-8 lg:grid-cols-2">
              <FadeIn>
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-slate-800">{t("analysis.priceTrendTitle")}</h3>
                  <InteractiveAreaChart points={priceLine} isCurrency />
                </section>
              </FadeIn>
              <FadeIn delay={0.05}>
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-slate-800">{t("analysis.channelDistribution")}</h3>
                  <InteractivePieChart
                    items={txDist.map((t) => {
                      const key = String(t.transactionType || t.label || t.name || "—")
                        .toLowerCase()
                        .trim();
                      return {
                        label: transactionTypeLabel(key),
                        value: t.value ?? 0,
                        percentage: t.percentage,
                      };
                    })}
                  />
                </section>
              </FadeIn>
              <FadeIn delay={0.1}>
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-slate-800">{t("analysis.topProductsByRevenue")}</h3>
                  <InteractiveBarChart
                    horizontal
                    valueFormatter={(n) => formatCurrency(n)}
                    items={topProducts.map((p) => ({
                      label: localized(p, "productName", `#${p.productId ?? "—"}`),
                      value:
                        p.totalRevenue ??
                        (p as { revenue?: number; value?: number }).revenue ??
                        (p as { revenue?: number; value?: number }).value ??
                        0,
                    }))}
                  />
                </section>
              </FadeIn>
              <FadeIn delay={0.15}>
                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-slate-800">{t("analysis.volumeByGovernorate")}</h3>
                  <InteractiveBarChart
                    horizontal
                    items={volumeGov.map((v) => ({
                      label: localized(v, "governorateName", `#${v.governorateId}`),
                      value: v.totalVolume ?? v.value ?? 0,
                    }))}
                  />
                </section>
              </FadeIn>
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
