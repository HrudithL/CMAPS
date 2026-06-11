import { useCallback, useEffect, useState } from "react";
import { fetchLanding, fetchMeta } from "../api/client";
import type { LandingResponse } from "../types/landing";

const DEFAULT_H = 200;

export function useLanding() {
  const [data, setData] = useState<LandingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [H, setH] = useState(DEFAULT_H);
  const [HOptions, setHOptions] = useState<number[]>([]);
  const [dateBounds, setDateBounds] = useState<{
    min: string;
    max: string;
  } | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((meta) => {
        const today = new Date().toISOString().slice(0, 10);
        const defaultDate =
          today <= meta.date_max && today >= meta.date_min
            ? today
            : meta.date_max;
        setDate(defaultDate);
        setHOptions(meta.grid.H_days);
        setDateBounds({ min: meta.date_min, max: meta.date_max });
        if (meta.grid.H_days.includes(meta.defaults.H)) {
          setH(meta.defaults.H);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const loadLanding = useCallback(async (analysisDate: string, hValue: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLanding({ date: analysisDate, H: hValue });
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    loadLanding(date, H);
  }, [date, H, loadLanding]);

  return {
    data,
    loading,
    error,
    date,
    H,
    HOptions,
    dateBounds,
    setDate,
    setH,
  };
}
