import type { StrategyResult } from "./analysis";

export interface SmoothingParams {
  median_b: number;
  m_default: number;
  r_default: number;
  m: number;
  r: number;
}

export interface SideCp {
  cp: number;
  smoothed_cp: number;
  hits: number;
  occurrences: number;
  forward_resolved: boolean;
}

export interface LandingTRow {
  T: number;
  long: SideCp;
  short: SideCp;
}

export interface LandingHBlock {
  H: number;
  k: number;
  ma: number;
  relation: string;
  by_T: LandingTRow[];
}

export interface LandingResponse {
  analysis_date: string;
  resolved_date: string;
  price_today: number;
  k_wiggle: number;
  selected_H: number | null;
  H_values: number[];
  T_values: number[];
  by_H: LandingHBlock[];
  smoothing: SmoothingParams;
  top_strategies: StrategyResult[];
}

export interface LandingMaBar {
  H: number;
  T: number;
  side: string;
  relation: string;
  cp: number;
  smoothed_cp: number;
  hits: number;
  occurrences: number;
}

export interface LandingPricePreview {
  dates: string[];
  price: number[];
  ma: (number | null)[];
}

export interface ContourSnippet {
  H_values: number[];
  T_values: number[];
  cp: (number | null)[][];
  smoothed_cp?: (number | null)[][];
  highlight: { H: number; T: number };
}

export interface LandingPrimary {
  H: number;
  T: number;
  cp: number;
  smoothed_cp: number;
  hits: number;
  occurrences: number;
  forward_resolved: boolean;
}

export interface LandingPreviewResponse {
  analysis_date: string;
  resolved_date: string;
  price_today: number;
  k_wiggle: number;
  chart_H: number;
  default_H: number;
  default_T: number;
  relation: string;
  price_preview: LandingPricePreview;
  ma_bars: LandingMaBar[];
  contour_snippet: ContourSnippet;
  primary: LandingPrimary;
  smoothing: SmoothingParams;
  analog_dates: string[];
}
