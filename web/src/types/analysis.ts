export interface MetaResponse {
  date_min: string;
  date_max: string;
  defaults: { H: number; T: number; k_wiggle: number };
  grid: { H_days: number[]; T_days: number[] };
  k_wiggle_sweep: { min: number; max: number; points: number };
}

export interface StrategyResult {
  H: number;
  T: number;
  side: string;
  k_today: number;
  relation: string;
  hits: number;
  occurrences: number;
  cp: number;
  forward_resolved: boolean;
}

export interface AnalogEvent {
  date: string;
  price: number;
  ma: number;
  k: number;
  future_date: string;
  future_price: number;
  hit: boolean;
  return_pct: number;
}

export interface CurvePoint {
  T?: number;
  H?: number;
  cp: number;
  n: number;
}

export interface CurveSeries {
  H?: number;
  T?: number;
  label: string;
  primary?: boolean;
  points: CurvePoint[];
}

export interface KWiggleLine {
  H: number;
  T: number;
  primary?: boolean;
  points: { k: number; cp: number; n: number }[];
}

export interface PriceContextPoint {
  date: string;
  price: number;
  [key: string]: string | number;
}

export interface AnalyzeResponse {
  analysis_date: string;
  resolved_date: string;
  side: string;
  k_today: number;
  relation: string;
  price_today: number;
  primary: {
    H: number;
    T: number;
    cp: number;
    hits: number;
    occurrences: number;
    forward_resolved: boolean;
  };
  price_context: {
    series: PriceContextPoint[];
    ma_windows: number[];
    primary_h: number;
    analysis_date: string;
  };
  analog_events: AnalogEvent[];
  cp_vs_T: { curves: CurveSeries[]; T_range: [number, number] };
  cp_vs_H: { curves: CurveSeries[]; H_range: [number, number] };
  k_wiggle_sweep: { long: KWiggleLine[]; short: KWiggleLine[] };
  heatmap: {
    H_values: number[];
    T_values: number[];
    long: (number | null)[][];
    short: (number | null)[][];
    occurrences: (number | null)[][];
    highlight: { H: number; T: number };
  };
  top_long: StrategyResult[];
  top_short: StrategyResult[];
  top_strategies: StrategyResult[];
}

export interface StrategyDetailResponse {
  analysis_date: string;
  resolved_date: string;
  summary: StrategyResult;
  analog_events: AnalogEvent[];
  forward_unresolved: boolean;
  stats: {
    hits: { mean: number; min: number; max: number } | null;
    misses: { mean: number; min: number; max: number } | null;
  };
}

export interface AnalysisParams {
  date: string;
  H: number;
  T: number;
  k_wiggle: number;
  min_occurrences?: number;
  top_n?: number;
}
