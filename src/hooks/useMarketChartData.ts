"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  daysBetween,
  getMarketTrends,
  getPriceVolatility,
  getSupplyDemandTrends,
} from "@/services/market-chart.api";
import type {
  ChartGroupBy,
  MarketChartLoadResult,
  MarketChartParams,
  VolatilityBar,
} from "@/types/market-chart";
import { ApiClientError } from "@/lib/api";

const UP_COLOR = "#26a69a80";
const DOWN_COLOR = "#ef535080";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function mapCandles(bars: VolatilityBar[]) {
  return bars.map((b) => ({
    time: toDateKey(b.date),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }));
}

function mergeVolume(
  bars: VolatilityBar[],
  dailyTrends: { date: string; totalVolume: number }[],
): MarketChartLoadResult["volume"] {
  const volumeByDate = new Map<string, number>();
  for (const d of dailyTrends) {
    volumeByDate.set(toDateKey(d.date), d.totalVolume);
  }

  return bars.map((bar) => {
    const time = toDateKey(bar.date);
    const vol = volumeByDate.get(time) ?? bar.transactionCount ?? 0;
    return {
      time,
      value: vol,
      color: bar.close >= bar.open ? UP_COLOR : DOWN_COLOR,
    };
  });
}

export function useMarketChartData(params: MarketChartParams | null, debounceMs = 300) {
  const [data, setData] = useState<MarketChartLoadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: MarketChartParams) => {
    setLoading(true);
    setError(null);
    try {
      const days =
        p.startDate && p.endDate
          ? daysBetween(p.startDate, p.endDate)
          : p.groupBy === "month"
            ? 365
            : p.groupBy === "week"
              ? 180
              : 90;

      const [volRes, trendRes, sdRes] = await Promise.all([
        getPriceVolatility(p.productId, p.governorate, p.groupBy, p.startDate, p.endDate),
        getMarketTrends(p.productId, p.governorate, days),
        getSupplyDemandTrends(p.productId, p.governorate, days),
      ]);

      const bars = volRes?.data ?? [];
      const candles = mapCandles(bars);

      if (candles.length === 0) {
        setData({
          candles: [],
          volume: [],
          supplyDemand: sdRes ?? { supply: [], demand: [], productName: volRes?.productName ?? "", governorate: null },
          productName: volRes?.productName ?? trendRes?.productName ?? "",
          summary: trendRes?.summary ?? {
            averagePriceChange: 0,
            volumeChange: 0,
            priceTrend: "stable",
            volumeTrend: "stable",
          },
          volatility: volRes?.overallVolatility ?? 0,
          lastPrice: 0,
          priceChange: trendRes?.summary?.averagePriceChange ?? 0,
        });
        return;
      }

      const last = candles[candles.length - 1];
      setData({
        candles,
        volume: mergeVolume(bars, trendRes?.dailyTrends ?? []),
        supplyDemand: sdRes ?? {
          supply: [],
          demand: [],
          productName: volRes.productName,
          governorate: volRes.governorate,
        },
        productName: volRes.productName || trendRes?.productName || "",
        summary: trendRes?.summary ?? {
          averagePriceChange: 0,
          volumeChange: 0,
          priceTrend: "stable",
          volumeTrend: "stable",
        },
        volatility: volRes.overallVolatility ?? 0,
        lastPrice: last.close,
        priceChange: trendRes?.summary?.averagePriceChange ?? 0,
      });
    } catch (e) {
      const msg =
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : "فشل تحميل بيانات المخطط";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params?.productId) {
      setData(null);
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      load(params);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [params, load, debounceMs]);

  const retry = useCallback(() => {
    if (params?.productId) load(params);
  }, [params, load]);

  return { data, loading, error, retry };
}
