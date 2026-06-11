import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAnalyze, fetchMeta } from "../api/client";
import type { AnalysisParams, AnalyzeResponse, MetaResponse } from "../types/analysis";

function paramsFromUrl(): Partial<AnalysisParams> {
  const params = new URLSearchParams(window.location.search);
  const parsed: Partial<AnalysisParams> = {};
  if (params.get("date")) parsed.date = params.get("date")!;
  if (params.get("H")) parsed.H = Number(params.get("H"));
  if (params.get("T")) parsed.T = Number(params.get("T"));
  if (params.get("k_wiggle")) parsed.k_wiggle = Number(params.get("k_wiggle"));
  return parsed;
}

function syncUrl(params: AnalysisParams) {
  const query = new URLSearchParams({
    date: params.date,
    H: String(params.H),
    T: String(params.T),
    k_wiggle: String(params.k_wiggle),
  });
  const next = `/plots?${query}`;
  window.history.replaceState(null, "", next);
}

export function useAnalysis() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [params, setParams] = useState<AnalysisParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m);
        const urlParams = paramsFromUrl();
        const today = new Date().toISOString().slice(0, 10);
        const defaultDate =
          today <= m.date_max && today >= m.date_min ? today : m.date_max;
        setParams({
          date: urlParams.date ?? defaultDate,
          H: urlParams.H ?? m.defaults.H,
          T: urlParams.T ?? m.defaults.T,
          k_wiggle: urlParams.k_wiggle ?? m.defaults.k_wiggle,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const runAnalysis = useCallback(async (p: AnalysisParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalyze(p);
      setData(result);
      syncUrl(p);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (autoUpdate) {
      debounceRef.current = window.setTimeout(() => runAnalysis(params), 400);
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [params, autoUpdate, runAnalysis]);

  const updateParams = useCallback((patch: Partial<AnalysisParams>) => {
    setParams((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const analyzeNow = useCallback(() => {
    if (params) runAnalysis(params);
  }, [params, runAnalysis]);

  return {
    meta,
    data,
    params,
    loading,
    error,
    autoUpdate,
    setAutoUpdate,
    updateParams,
    analyzeNow,
    setError,
  };
}
