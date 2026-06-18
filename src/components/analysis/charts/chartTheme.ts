export const CHART_COLORS = [
  "#059669",
  "#10b981",
  "#34d399",
  "#047857",
  "#065f46",
  "#6ee7b7",
  "#14b8a6",
  "#0d9488",
];

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
  fontSize: "13px",
  direction: "rtl" as const,
};

export const CHART_GRID = { stroke: "#e2e8f0", strokeDasharray: "4 4" };

export const CHART_GRID_DARK = { stroke: "#334155", strokeDasharray: "4 4" };

export const CHART_TICK_LIGHT = { fill: "#64748b" };
export const CHART_TICK_DARK = { fill: "#94a3b8" };

export function getChartGrid(isDark: boolean) {
  return isDark ? CHART_GRID_DARK : CHART_GRID;
}

export function getChartTooltipStyle(isDark: boolean) {
  return isDark ? CHART_TOOLTIP_STYLE_DARK : CHART_TOOLTIP_STYLE;
}

export const CHART_TOOLTIP_STYLE_DARK = {
  backgroundColor: "#111827",
  border: "1px solid #334155",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  fontSize: "13px",
  color: "#f8fafc",
  direction: "rtl" as const,
};

export const CANDLE_CHART_THEME_LIGHT = {
  layout: {
    background: { type: "solid" as const, color: "#ffffff" },
    textColor: "#475569",
  },
  grid: {
    vertLines: { color: "#e2e8f0" },
    horzLines: { color: "#e2e8f0" },
  },
  rightPriceScale: { borderColor: "#e2e8f0" },
  timeScale: { borderColor: "#e2e8f0", timeVisible: true },
};

export const CANDLE_CHART_THEME_DARK = {
  layout: {
    background: { type: "solid" as const, color: "#1e222d" },
    textColor: "#d1d4dc",
  },
  grid: {
    vertLines: { color: "#2a2e39" },
    horzLines: { color: "#2a2e39" },
  },
  rightPriceScale: { borderColor: "#2a2e39" },
  timeScale: { borderColor: "#2a2e39", timeVisible: true },
};
