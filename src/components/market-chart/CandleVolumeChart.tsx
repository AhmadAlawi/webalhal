"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { CandlePoint, VolumePoint } from "@/types/market-chart";

const CHART_THEME = {
  layout: {
    background: { type: ColorType.Solid, color: "#1e222d" },
    textColor: "#d1d4dc",
  },
  grid: {
    vertLines: { color: "#2a2e39" },
    horzLines: { color: "#2a2e39" },
  },
  rightPriceScale: { borderColor: "#2a2e39" },
  timeScale: { borderColor: "#2a2e39", timeVisible: true },
};

export function CandleVolumeChart({
  candles,
  volume,
  height = 420,
}: {
  candles: CandlePoint[];
  volume: VolumePoint[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      ...CHART_THEME,
      width: el.clientWidth,
      height,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current) return;

    if (candles.length === 0) {
      candleRef.current.setData([]);
      volumeRef.current.setData([]);
      return;
    }

    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as `${number}-${number}-${number}`,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    volumeRef.current.setData(
      volume.map((v) => ({
        time: v.time as `${number}-${number}-${number}`,
        value: v.value,
        color: v.color,
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [candles, volume]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg"
      style={{ height }}
      dir="ltr"
    />
  );
}
