import type { Config, Layout } from "plotly.js";

/** Pan with drag, zoom with scroll wheel; no box-select zoom. */
export const PLOTLY_PAN_ZOOM_CONFIG: Partial<Config> = {
  responsive: true,
  displayModeBar: true,
  scrollZoom: true,
  modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"],
};

export const PLOTLY_PAN_ZOOM_LAYOUT: Partial<Layout> = {
  dragmode: "pan",
};

/** Shared light-theme chart chrome matching app design tokens. */
export const PLOTLY_THEME_LAYOUT: Partial<Layout> = {
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#fafaf9",
  font: {
    family: "Inter, system-ui, sans-serif",
    color: "#44403c",
    size: 12,
  },
  colorway: ["#1a1917", "#f59e0b", "#6366f1", "#10b981", "#78716c"],
  xaxis: {
    gridcolor: "#e8e7e3",
    linecolor: "#d6d3d1",
    zerolinecolor: "#e8e7e3",
  },
  yaxis: {
    gridcolor: "#e8e7e3",
    linecolor: "#d6d3d1",
    zerolinecolor: "#e8e7e3",
  },
};

export function themedLayout(overrides: Partial<Layout> = {}): Partial<Layout> {
  return {
    ...PLOTLY_PAN_ZOOM_LAYOUT,
    ...PLOTLY_THEME_LAYOUT,
    ...overrides,
    font: { ...PLOTLY_THEME_LAYOUT.font, ...overrides.font },
    xaxis: { ...PLOTLY_THEME_LAYOUT.xaxis, ...overrides.xaxis },
    yaxis: { ...PLOTLY_THEME_LAYOUT.yaxis, ...overrides.yaxis },
  };
}
