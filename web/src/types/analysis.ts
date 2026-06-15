export interface MetaResponse {
  date_min: string;
  date_max: string;
  defaults: { H: number; T: number; k_wiggle: number };
  grid: { H_days: number[]; T_days: number[] };
  k_wiggle_sweep: { min: number; max: number; points: number };
}

export interface SmoothingParams {
  median_b: number;
  m_default: number;
  r_default: number;
  m: number;
  r: number;
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
  smoothed_cp?: number;
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

export interface PriceContextPoint {
  date: string;
  price: number;
  [key: string]: string | number;
}

export interface PriceContext {
  dates: string[];
  price: number[];
  ma: Record<string, (number | null)[]>;
  ma_windows: number[];
  analysis_date: string;
}

export interface ContourHighlightStats {
  H: number;
  T: number;
  side: string;
  cp: number;
  smoothed_cp: number;
  hits: number;
  occurrences: number;
  k_today: number;
  forward_resolved: boolean;
}

export interface ContourPayload {
  H_values: number[];
  T_values: number[];
  cp: (number | null)[][];
  smoothed_cp: (number | null)[][];
  occurrences: (number | null)[][];
  sides: (string | null)[][];
  boundary_h: number[];
  highlight: { H: number; T: number };
  highlight_stats: ContourHighlightStats | null;
  smoothing: SmoothingParams;
}

export interface KDistributionPayload {
  H: number;
  k_today: number;
  k_wiggle: number;
  k_values: number[];
  within_wiggle: number;
  total_history: number;
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
    smoothed_cp: number;
    hits: number;
    occurrences: number;
    forward_resolved: boolean;
  };
  smoothing: SmoothingParams;
  price_context: PriceContext;
  analog_events: AnalogEvent[];
  contour: ContourPayload;
  k_distribution: KDistributionPayload;
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
  m?: number;
  r?: number;
  min_occurrences?: number;
  top_n?: number;
}
