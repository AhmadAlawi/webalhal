export interface KpiCard {
  title?: string;
  value?: number;
  unit?: string;
  changePercentage?: number;
  trend?: "up" | "down" | "stable";
  comparisonPeriod?: string;
}

export interface SparkPoint {
  date?: string;
  value?: number;
}

export interface TopProductItem {
  category?: string;
  name?: string;
  productName?: string;
  value?: number;
}

export interface DashboardSummaryData {
  totalRevenue?: KpiCard;
  totalVolume?: KpiCard;
  totalTransactions?: KpiCard;
  averagePrice?: KpiCard;
  activeProducts?: KpiCard;
  topGovernorate?: KpiCard;
  revenueSparkline?: SparkPoint[];
  topProducts?: TopProductItem[];
}

export interface PriceTrendPoint {
  date?: string;
  value?: number;
}

export interface PriceTrendsChartData {
  averagePrice?: PriceTrendPoint[];
  minPrice?: PriceTrendPoint[];
  maxPrice?: PriceTrendPoint[];
  productName?: string;
  governorate?: number;
}

export interface ChartSlice {
  label?: string;
  name?: string;
  value?: number;
  percentage?: number;
  transactionType?: string;
}

export interface TopProductSales {
  productId?: number;
  productName?: string;
  name?: string;
  totalRevenue?: number;
  totalVolume?: number;
  transactionCount?: number;
}

export interface VolumeByGovernorate {
  governorateId?: number;
  governorateName?: string;
  name?: string;
  totalVolume?: number;
  value?: number;
}

export interface AnalysisFiltersAvailable {
  governorates?: { id: number; name?: string; nameAr?: string }[];
  products?: { id: number; name?: string; nameAr?: string; categoryId?: number }[];
  categories?: { id: number; name?: string; nameAr?: string }[];
  transactionTypes?: string[];
  minDate?: string;
  maxDate?: string;
  dateRange?: { min?: string; max?: string };
}

export interface MarketAnalysisFilters {
  governorateId?: number;
  productId?: number;
  days?: number;
  startDate?: string;
  endDate?: string;
}
