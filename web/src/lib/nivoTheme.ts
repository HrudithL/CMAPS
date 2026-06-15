import type { PartialTheme } from "@nivo/theming";
import type { Theme } from "../context/ThemeContext";

export const MANAGUA_COLORS = [
  "#43123e",
  "#883e39",
  "#562949",
  "#5e4fac",
  "#5c84bf",
  "#80e7fe",
] as const;

/** Nivo sequential scale — theme orange (low) → sky blue (high). */
export const CP_SURFACE_SEQUENTIAL = {
  type: "sequential" as const,
  colors: ["#f59e0b", "#38bdf8"] as [string, string],
  minValue: 0,
  maxValue: 1,
};

/** Legacy Managua ramp (kept for reference / exports). */
export const MANAGUA_SEQUENTIAL = {
  type: "sequential" as const,
  colors: [MANAGUA_COLORS[0], MANAGUA_COLORS[MANAGUA_COLORS.length - 1]] as [
    string,
    string,
  ],
  minValue: 0,
  maxValue: 1,
};

export type HeatmapCell = {
  serieId: string | number;
  data: { x: string | number };
};

export function isHighlightedCell(
  cell: HeatmapCell,
  h: number,
  t: number,
): boolean {
  return cell.serieId === String(h) && cell.data.x === String(t);
}

export const CHART_PALETTE = {
  price: "#f59e0b",
  /** Muted amber for full-history price line on plots page */
  pricePlot: "#a67c35",
  priceSoft: "rgba(245, 158, 11, 0.18)",
  ma: ["#c4b5fd", "#818cf8", "#38bdf8"] as const,
  hit: "#34d399",
  miss: "#fb7185",
  today: "#f7f8f8",
  ring: "#fbbf24",
  indigo: "#6366f1",
} as const;

export function buildNivoTheme(mode: Theme): PartialTheme {
  const isDark = mode === "dark";
  const text = isDark ? "#8a8f98" : "#78716c";
  const line = isDark ? "#383b3f" : "#d6d3d1";
  const grid = isDark ? "rgba(35, 37, 42, 0.85)" : "rgba(232, 231, 227, 0.9)";

  return {
    background: "transparent",
    text: {
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      fontSize: 11,
      fill: text,
    },
    axis: {
      domain: {
        line: { stroke: line, strokeWidth: 1 },
      },
      ticks: {
        line: { stroke: line, strokeWidth: 1 },
        text: { fill: text, fontSize: 10 },
      },
      legend: {
        text: { fill: text, fontSize: 11, fontWeight: 500 },
      },
    },
    grid: {
      line: { stroke: grid, strokeWidth: 1 },
    },
    crosshair: {
      line: {
        stroke: CHART_PALETTE.price,
        strokeWidth: 1,
        strokeOpacity: 0.55,
        strokeDasharray: "4 4",
      },
    },
    tooltip: {
      container: {
        background: isDark ? "rgba(15, 16, 17, 0.94)" : "rgba(255, 255, 255, 0.96)",
        color: isDark ? "#f7f8f8" : "#1a1917",
        fontSize: 11,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        borderRadius: 8,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.45)"
          : "0 8px 24px rgba(26,25,23,0.12)",
        border: `1px solid ${isDark ? "#383b3f" : "#e8e7e3"}`,
        padding: "8px 12px",
      },
    },
    labels: {
      text: {
        fill: isDark ? "#d0d6e0" : "#44403c",
        fontSize: 10,
        fontWeight: 500,
      },
    },
  };
}

export const NIVO_MOTION = {
  animate: true,
  motionConfig: "gentle" as const,
};

/** Heavy charts — skip animation to keep UI responsive. */
export const NIVO_STATIC = {
  animate: false,
  motionConfig: "default" as const,
};

export const HEATMAP_MAX_SIDE = 32;
