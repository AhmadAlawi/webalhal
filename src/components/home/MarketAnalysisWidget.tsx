"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowLeft, Map } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { KpiCardView } from "@/components/analysis/KpiCardView";
import { MiniSparkline } from "@/components/analysis/MiniSparkline";
import { FadeIn } from "@/components/motion/FadeIn";
import { SyriaMarketMapDynamic } from "@/components/maps/SyriaMarketMapDynamic";
import { getDashboardSummary, getVolumeByGovernorate } from "@/services/market-analysis";
import { toMapVolumePoints } from "@/lib/syria-governorates";
import type { DashboardSummaryData } from "@/types/market-analysis";

export function MarketAnalysisWidget() {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [mapPoints, setMapPoints] = useState<ReturnType<typeof toMapVolumePoints>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary({ days: 30 }),
      getVolumeByGovernorate({ days: 30 }),
    ])
      .then(([s, vol]) => {
        setSummary(s);
        setMapPoints(toMapVolumePoints(vol));
      })
      .catch(() => {
        setSummary(null);
        setMapPoints([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-emerald-100 bg-gradient-to-l from-emerald-50 via-white to-emerald-50/30 py-10 lg:py-14">
      <div
        className="pointer-events-none absolute -start-20 top-10 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl"
        aria-hidden
      />
      <PageContainer className="relative">
        <FadeIn className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/25">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">تحليلات السوق</h2>
              <p className="text-sm text-slate-600">
                مؤشرات تفاعلية وخريطة حجم المبيعات — آخر 30 يوماً
              </p>
            </div>
          </div>
          <Link
            href="/market-analysis"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
          >
            مخطط الشموع التفاعلي
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </FadeIn>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
              ))}
            </div>
            <div className="h-64 skeleton-shimmer rounded-2xl" />
          </div>
        ) : summary ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCardView kpi={summary.totalRevenue} isCurrency />
                <KpiCardView kpi={summary.totalVolume} />
                <KpiCardView kpi={summary.totalTransactions} />
                <KpiCardView kpi={summary.averagePrice} isCurrency />
              </div>
              {summary.revenueSparkline && summary.revenueSparkline.length > 0 && (
                <FadeIn delay={0.15} className="card mt-6 p-5">
                  <p className="mb-3 text-sm font-medium text-slate-600">اتجاه الإيرادات</p>
                  <MiniSparkline points={summary.revenueSparkline} isCurrency />
                </FadeIn>
              )}
            </div>
            <FadeIn delay={0.1}>
              <div className="card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Map className="h-4 w-4 text-emerald-600" />
                  خريطة سوريا — الحجم حسب المحافظة
                </div>
                <SyriaMarketMapDynamic points={mapPoints} height={280} />
                {!mapPoints.length && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    المحافظات معروضة — ستظهر أحجام المبيعات عند توفر البيانات
                  </p>
                )}
                <Link
                  href="/market-analysis/overview"
                  className="mt-3 block text-center text-xs font-medium text-emerald-600 hover:underline"
                >
                  نظرة عامة تفصيلية + خرائط
                </Link>
              </div>
            </FadeIn>
          </div>
        ) : (
          <FadeIn>
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-6 py-10 text-center">
              <p className="text-slate-600">لا تتوفر بيانات تحليلية حالياً</p>
              <Link
                href="/market-analysis"
                className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline"
              >
                انتقل لصفحة التحليلات
              </Link>
            </div>
          </FadeIn>
        )}
      </PageContainer>
    </section>
  );
}
