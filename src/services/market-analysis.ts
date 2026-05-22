import { apiGet } from "@/lib/api";
import type {
  AnalysisFiltersAvailable,
  ChartSlice,
  DashboardSummaryData,
  MarketAnalysisFilters,
  PriceTrendsChartData,
  TopProductSales,
  VolumeByGovernorate,
} from "@/types/market-analysis";

function buildQuery(params: MarketAnalysisFilters & Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  if (params.governorateId != null) {
    sp.set("governorate", String(params.governorateId));
    sp.set("Governorate", String(params.governorateId));
  }
  if (params.productId != null) sp.set("ProductId", String(params.productId));
  if (params.days != null) sp.set("days", String(params.days));
  if (params.startDate) {
    sp.set("startDate", params.startDate);
    sp.set("StartDate", params.startDate);
  }
  if (params.endDate) {
    sp.set("endDate", params.endDate);
    sp.set("EndDate", params.endDate);
  }
  for (const [k, v] of Object.entries(params)) {
    if (["governorateId", "productId", "days", "startDate", "endDate"].includes(k)) continue;
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getAnalysisFiltersAvailable() {
  return apiGet<AnalysisFiltersAvailable>("/api/MarketAnalysis/filters/available");
}

export async function getDashboardSummary(filters: MarketAnalysisFilters = {}) {
  return apiGet<DashboardSummaryData>(
    `/api/MarketAnalysis/charts/dashboard-summary${buildQuery({ days: 30, ...filters })}`,
  );
}

export async function getPriceTrendsChart(filters: MarketAnalysisFilters = {}) {
  return apiGet<PriceTrendsChartData>(
    `/api/MarketAnalysis/charts/price-trends${buildQuery({ days: 30, groupBy: "day", ...filters })}`,
  );
}

export async function getTransactionTypeDistribution(filters: MarketAnalysisFilters = {}) {
  const data = await apiGet<ChartSlice[] | { items?: ChartSlice[]; data?: ChartSlice[] }>(
    `/api/MarketAnalysis/charts/transaction-type-distribution${buildQuery({ days: 30, ...filters })}`,
  );
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.data ?? [];
}

export async function getTopProductsByRevenue(
  filters: MarketAnalysisFilters & { topN?: number } = {},
) {
  const data = await apiGet<TopProductSales[] | { items?: TopProductSales[] }>(
    `/api/MarketAnalysis/charts/top-products-by-revenue${buildQuery({ topN: 10, days: 30, ...filters })}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getVolumeByGovernorate(filters: MarketAnalysisFilters = {}) {
  const data = await apiGet<VolumeByGovernorate[] | { items?: VolumeByGovernorate[] }>(
    `/api/MarketAnalysis/charts/volume-by-governorate${buildQuery({ days: 30, ...filters })}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getDailySalesSparkline(filters: MarketAnalysisFilters = {}) {
  const data = await apiGet<{ points?: { date?: string; value?: number }[] } | { date?: string; value?: number }[]>(
    `/api/MarketAnalysis/charts/daily-sales-sparkline${buildQuery({ days: 7, ...filters })}`,
  );
  if (Array.isArray(data)) return data;
  return data?.points ?? [];
}
