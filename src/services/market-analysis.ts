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

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const obj = asObject(value);
  if (!obj) return [];
  const direct =
    obj.items ??
    obj.data ??
    obj.results ??
    obj.value ??
    obj.list ??
    obj.rows ??
    obj.topProducts ??
    obj.governorates ??
    obj.products ??
    obj.transactionTypes;
  if (Array.isArray(direct)) return direct as T[];
  return [];
}

function pickNumber(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function normalizeGovernorateFilter(
  value: unknown,
): { id: number; name?: string; nameAr?: string } | null {
  const g = asObject(value);
  if (!g) return null;
  const id = pickNumber(g.id, g.governorateId, g.GovernorateId);
  if (!id) return null;
  return {
    id,
    nameAr: pickString(g.nameAr, g.NameAr, g.governorateNameAr),
    name: pickString(g.name, g.Name, g.governorateName, g.GovernorateName),
  };
}

function normalizeProductFilter(
  value: unknown,
): { id: number; name?: string; nameAr?: string; categoryId?: number } | null {
  const p = asObject(value);
  if (!p) return null;
  const id = pickNumber(p.id, p.productId, p.ProductId);
  if (!id) return null;
  return {
    id,
    nameAr: pickString(p.nameAr, p.NameAr, p.productNameAr),
    name: pickString(p.name, p.Name, p.productName, p.ProductName),
    categoryId: pickNumber(p.categoryId, p.CategoryId),
  };
}

function normalizeCategoryFilter(
  value: unknown,
): { id: number; name?: string; nameAr?: string } | null {
  const c = asObject(value);
  if (!c) return null;
  const id = pickNumber(c.id, c.categoryId, c.CategoryId);
  if (!id) return null;
  return {
    id,
    nameAr: pickString(c.nameAr, c.NameAr),
    name: pickString(c.name, c.Name),
  };
}

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

export async function getAnalysisFiltersAvailable(): Promise<AnalysisFiltersAvailable> {
  const raw = await apiGet<unknown>("/api/MarketAnalysis/filters/available");
  const root = asObject(raw) ?? {};
  const governoratesRaw = extractArray<unknown>(
    root.governorates ?? root.Governorates ?? root.governorateFilters,
  );
  const productsRaw = extractArray<unknown>(
    root.products ?? root.Products ?? root.productFilters,
  );
  const categoriesRaw = extractArray<unknown>(root.categories ?? root.Categories);

  const governorates: NonNullable<AnalysisFiltersAvailable["governorates"]> =
    governoratesRaw.map(normalizeGovernorateFilter).filter((g): g is NonNullable<typeof g> => Boolean(g));

  const products: NonNullable<AnalysisFiltersAvailable["products"]> =
    productsRaw.map(normalizeProductFilter).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const categories: NonNullable<AnalysisFiltersAvailable["categories"]> =
    categoriesRaw
      .map(normalizeCategoryFilter)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (!governorates.length || !products.length) {
    const [fallbackGov, fallbackProducts] = await Promise.all([
      apiGet<unknown>("/api/MarketAnalysis/filters/governorates").catch(() => []),
      apiGet<unknown>("/api/MarketAnalysis/filters/products").catch(() => []),
    ]);
    const fg: NonNullable<AnalysisFiltersAvailable["governorates"]> = extractArray<unknown>(
      fallbackGov,
    )
      .map(normalizeGovernorateFilter)
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
    const fp: NonNullable<AnalysisFiltersAvailable["products"]> = extractArray<unknown>(
      fallbackProducts,
    )
      .map(normalizeProductFilter)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    return {
      governorates: governorates.length ? governorates : fg,
      products: products.length ? products : fp,
      categories,
      transactionTypes: extractArray<string>(root.transactionTypes ?? root.TransactionTypes),
    };
  }

  return {
    governorates,
    products,
    categories,
    transactionTypes: extractArray<string>(root.transactionTypes ?? root.TransactionTypes),
  };
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
  const data = await apiGet<unknown>(
    `/api/MarketAnalysis/charts/transaction-type-distribution${buildQuery({ days: 30, ...filters })}`,
  );
  return extractArray<ChartSlice>(data);
}

export async function getTopProductsByRevenue(
  filters: MarketAnalysisFilters & { topN?: number } = {},
) {
  const data = await apiGet<unknown>(
    `/api/MarketAnalysis/charts/top-products-by-revenue${buildQuery({ topN: 10, days: 30, ...filters })}`,
  );
  return extractArray<TopProductSales>(data);
}

export async function getVolumeByGovernorate(filters: MarketAnalysisFilters = {}) {
  const data = await apiGet<unknown>(
    `/api/MarketAnalysis/charts/volume-by-governorate${buildQuery({ days: 30, ...filters })}`,
  );
  return extractArray<VolumeByGovernorate>(data);
}

export async function getDailySalesSparkline(filters: MarketAnalysisFilters = {}) {
  const data = await apiGet<{ points?: { date?: string; value?: number }[] } | { date?: string; value?: number }[]>(
    `/api/MarketAnalysis/charts/daily-sales-sparkline${buildQuery({ days: 7, ...filters })}`,
  );
  if (Array.isArray(data)) return data;
  return data?.points ?? [];
}
