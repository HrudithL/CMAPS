export interface SideCp {
  cp: number;
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
}
