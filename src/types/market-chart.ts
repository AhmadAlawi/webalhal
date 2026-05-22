export type ChartGroupBy = "day" | "week" | "month";

export interface VolatilityBar {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  averagePrice: number;
  transactionCount: number;
}

export interface PriceVolatilityChartData {
  data: VolatilityBar[];
  productName: string;
  governorate: number | null;
  overallVolatility: number;
}

export interface DailyTrend {
  date: string;
  averagePrice: number;
  totalVolume: number;
  transactionCount: number;
}

export interface MarketTrendsResponse {
  productName: string;
  governorateId: number | null;
  startDate: string;
  endDate: string;
  dailyTrends: DailyTrend[];
  summary: {
    averagePriceChange: number;
    volumeChange: number;
    priceTrend: string;
    volumeTrend: string;
  };
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface MultiSeriesTimeData {
  supply: TimeSeriesPoint[];
  demand: TimeSeriesPoint[];
  productName: string;
  governorate: number | null;
}

export interface FilterProduct {
  id: number;
  name?: string;
  nameAr?: string;
  categoryId?: number;
}

export interface FilterGovernorate {
  id: number;
  name?: string;
  nameAr?: string;
}

export interface DateRangeFilter {
  min?: string;
  max?: string;
  minDate?: string;
  maxDate?: string;
}

export interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: string;
  value: number;
  color: string;
}

export interface MarketChartLoadResult {
  candles: CandlePoint[];
  volume: VolumePoint[];
  supplyDemand: MultiSeriesTimeData;
  productName: string;
  summary: MarketTrendsResponse["summary"];
  volatility: number;
  lastPrice: number;
  priceChange: number;
}

export interface MarketChartParams {
  productId: number;
  governorate: number;
  groupBy: ChartGroupBy;
  startDate?: string;
  endDate?: string;
}
