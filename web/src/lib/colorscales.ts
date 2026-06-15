import type { ColorScale } from "plotly.js";

/** Matplotlib managua — warm gold → plum → cyan (user ref. gradient 1). */
export const MANAGUA_SCALE: ColorScale = [
  [0, "#ffcf67"],
  [0.071, "#e8ab5b"],
  [0.143, "#d38c50"],
  [0.214, "#bd6f47"],
  [0.286, "#a4553f"],
  [0.357, "#883e39"],
  [0.429, "#6c2d3a"],
  [0.5, "#562949"],
  [0.571, "#4d3565"],
  [0.643, "#4c4c88"],
  [0.714, "#5267a6"],
  [0.786, "#5c84bf"],
  [0.857, "#68a2d5"],
  [0.929, "#74c3e9"],
  [1, "#80e7fe"],
];

/** Matplotlib RdYlBu — red/gold → pale yellow → blue (user ref. gradient 2). */
export const RDYLBU_SCALE: ColorScale = [
  [0, "#a50026"],
  [0.1, "#d62f26"],
  [0.2, "#f46d43"],
  [0.3, "#fcac60"],
  [0.4, "#fee090"],
  [0.5, "#fefec0"],
  [0.6, "#e0f3f7"],
  [0.7, "#a9d8e8"],
  [0.8, "#74add1"],
  [0.9, "#4473b3"],
  [1, "#313695"],
];

/** Diverging scale for CP: rose (low) → slate (mid) → teal (high). */
export const CP_DIVERGING_SCALE: ColorScale = [
  [0, "#b91c1c"],
  [0.2, "#e11d48"],
  [0.35, "#fda4af"],
  [0.5, "#f1f5f9"],
  [0.65, "#99f6e4"],
  [0.8, "#14b8a6"],
  [1, "#0f766e"],
];

/** Matplotlib twilight (dark → light), sampled 0.55 → 0 (user ref. gradient 3). */
export const TWILIGHT_DARK_LIGHT_SCALE: ColorScale = [
  [0, "#43123e"],
  [0.071, "#321237"],
  [0.143, "#371043"],
  [0.214, "#471460"],
  [0.286, "#552182"],
  [0.357, "#5c379b"],
  [0.429, "#5e4fac"],
  [0.5, "#5f67b6"],
  [0.571, "#647dbc"],
  [0.643, "#6e92bf"],
  [0.714, "#80a5c3"],
  [0.786, "#98b7c7"],
  [0.857, "#b6c7cf"],
  [0.929, "#d2d5da"],
  [1, "#e1d8e2"],
];
