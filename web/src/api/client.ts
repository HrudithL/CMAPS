import type {
  AnalysisParams,
  AnalyzeResponse,
  MetaResponse,
  StrategyDetailResponse,
} from "../types/analysis";
import type { LandingResponse } from "../types/landing";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return response.json();
}

export function fetchMeta(): Promise<MetaResponse> {
  return request<MetaResponse>("/api/meta");
}

export function fetchLanding(params?: {
  date?: string;
  H?: number;
}): Promise<LandingResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.H !== undefined) query.set("H", String(params.H));
  const suffix = query.toString() ? `?${query}` : "";
  return request<LandingResponse>(`/api/landing${suffix}`);
}

export function fetchAnalyze(params: AnalysisParams): Promise<AnalyzeResponse> {
  const query = new URLSearchParams({
    date: params.date,
    H: String(params.H),
    T: String(params.T),
    k_wiggle: String(params.k_wiggle),
  });
  if (params.m !== undefined) {
    query.set("m", String(params.m));
  }
  if (params.r !== undefined) {
    query.set("r", String(params.r));
  }
  if (params.min_occurrences !== undefined) {
    query.set("min_occurrences", String(params.min_occurrences));
  }
  if (params.top_n !== undefined) {
    query.set("top_n", String(params.top_n));
  }
  return request<AnalyzeResponse>(`/api/analyze?${query}`);
}

export function fetchStrategyDetail(
  params: AnalysisParams & { side?: string },
): Promise<StrategyDetailResponse> {
  const query = new URLSearchParams({
    date: params.date,
    H: String(params.H),
    T: String(params.T),
    k_wiggle: String(params.k_wiggle),
  });
  if (params.side) query.set("side", params.side);
  return request<StrategyDetailResponse>(`/api/strategy/detail?${query}`);
}

export function refreshData(): Promise<{ rows_added: number; date_max: string }> {
  return request("/api/data/refresh", { method: "POST" });
}
