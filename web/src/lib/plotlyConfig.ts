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
