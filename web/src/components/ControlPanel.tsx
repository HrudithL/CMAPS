import { formatMaRelation } from "../lib/maRelation";
import type { AnalysisParams, AnalyzeResponse, MetaResponse } from "../types/analysis";

interface Props {
  meta: MetaResponse;
  params: AnalysisParams;
  data: AnalyzeResponse | null;
  loading: boolean;
  onParamsChange: (patch: Partial<AnalysisParams>) => void;
  onAnalyze: (patch?: Partial<AnalysisParams>) => void;
}

const inputClass =
  "rounded-lg border border-[var(--color-chalk)] bg-[var(--color-fog)] px-3 py-2 text-sm text-[var(--color-carbon)] outline-none focus:border-[var(--color-amber)]";

export function ControlPanel({
  meta,
  params,
  data,
  loading,
  onParamsChange,
  onAnalyze,
}: Props) {
  const sideClass =
    data?.side === "long"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : data?.side === "short"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : "bg-[var(--color-fog)] text-[var(--color-graphite)] border-[var(--color-chalk)]";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
      <div className="app-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-amber-dim)]">
              Plots
            </p>
            <h1 className="font-display text-xl font-medium text-[var(--color-carbon)]">
              Interactive explorer
            </h1>
          </div>
          <p className="font-mono text-xs text-[var(--color-slate-ui)]">
            Data through {meta.date_max}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            Analysis date
            <input
              type="date"
              className={inputClass}
              min={meta.date_min}
              max={meta.date_max}
              value={params.date}
              onChange={(e) => onParamsChange({ date: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            H (days)
            <input
              type="number"
              min={1}
              max={2000}
              className={`w-24 ${inputClass}`}
              value={params.H}
              onChange={(e) => onParamsChange({ H: Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            T (days)
            <input
              type="number"
              min={1}
              max={2000}
              className={`w-24 ${inputClass}`}
              value={params.T}
              onChange={(e) => onParamsChange({ T: Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            m
            <input
              type="number"
              min={0}
              step={0.1}
              className={`w-24 ${inputClass}`}
              value={params.m ?? ""}
              placeholder="auto"
              onChange={(e) =>
                onParamsChange({
                  m: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            r
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              className={`w-24 ${inputClass}`}
              value={params.r ?? ""}
              placeholder="auto"
              onChange={(e) =>
                onParamsChange({
                  r: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>

          <label className="flex min-w-[180px] flex-col gap-1.5 text-xs font-medium text-[var(--color-slate-ui)]">
            k wiggle ±{params.k_wiggle.toFixed(3)}
            <input
              type="range"
              min={0.001}
              max={0.15}
              step={0.001}
              className="accent-[var(--color-amber)]"
              value={params.k_wiggle}
              onChange={(e) =>
                onParamsChange({ k_wiggle: Number(e.target.value) })
              }
            />
          </label>

          <button
            type="button"
            className="app-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            onClick={() => onAnalyze()}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {data && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-chalk)] pt-4 text-sm">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${sideClass}`}
            >
              {data.side}
            </span>
            <span className="text-[var(--color-graphite)]">
              k = {data.k_today.toFixed(4)} ({formatMaRelation(data.relation, params.H)})
            </span>
            <span className="font-medium text-[var(--color-carbon)]">
              CP {(data.primary.cp * 100).toFixed(1)}% ({data.primary.hits}/
              {data.primary.occurrences})
            </span>
            <span className="text-[var(--color-graphite)]">
              Smoothed {(data.primary.smoothed_cp * 100).toFixed(1)}%
            </span>
            <span className="font-mono text-[var(--color-graphite)]">
              BTC ${data.price_today.toLocaleString()}
            </span>
            {data.resolved_date !== data.analysis_date && (
              <span className="text-xs text-amber-700">
                Resolved to {data.resolved_date}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
