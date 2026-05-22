import { apiGet } from "@/lib/api";
import type {
  ChartGroupBy,
  DateRangeFilter,
  FilterGovernorate,
  FilterProduct,
  MarketTrendsResponse,
  MultiSeriesTimeData,
  PriceVolatilityChartData,
} from "@/types/market-chart";

function govParam(governorate: number) {
  return governorate > 0 ? String(governorate) : "0";
}

export async function getChartProducts(category?: string, governorate?: number) {
  const sp = new URLSearchParams();
  if (category) sp.set("category", category);
  if (governorate != null && governorate > 0) sp.set("governorate", String(governorate));
  const qs = sp.toString() ? `?${sp}` : "";
  const data = await apiGet<FilterProduct[] | { items?: FilterProduct[] }>(
    `/api/MarketAnalysis/filters/products${qs}`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getChartGovernorates() {
  const data = await apiGet<FilterGovernorate[] | { items?: FilterGovernorate[] }>(
    "/api/MarketAnalysis/filters/governorates",
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getChartDateRange(productId: number, governorate: number) {
  const sp = new URLSearchParams({
    ProductId: String(productId),
    governorate: govParam(governorate),
  });
  return apiGet<DateRangeFilter>(`/api/MarketAnalysis/filters/date-range?${sp}`);
}

export async function getPriceVolatility(
  productId: number,
  governorate: number,
  groupBy: ChartGroupBy,
  startDate?: string,
  endDate?: string,
) {
  const sp = new URLSearchParams({
    ProductId: String(productId),
    governorate: govParam(governorate),
    groupBy,
  });
  if (startDate) sp.set("startDate", startDate);
  if (endDate) sp.set("endDate", endDate);
  return apiGet<PriceVolatilityChartData>(
    `/api/MarketAnalysis/charts/price-volatility?${sp}`,
  );
}

export async function getMarketTrends(productId: number, governorate: number, days: number) {
  const sp = new URLSearchParams({
    ProductId: String(productId),
    governorate: govParam(governorate),
    days: String(Math.max(7, days)),
  });
  return apiGet<MarketTrendsResponse>(`/api/MarketAnalysis/market-trends?${sp}`);
}

export async function getSupplyDemandTrends(
  productId: number,
  governorate: number,
  days: number,
) {
  const sp = new URLSearchParams({
    ProductId: String(productId),
    governorate: govParam(governorate),
    days: String(Math.max(7, days)),
  });
  return apiGet<MultiSeriesTimeData>(
    `/api/MarketAnalysis/charts/supply-demand-trends?${sp}`,
  );
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(7, diff);
}
