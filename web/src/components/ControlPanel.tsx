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

const PREFERRED_H = [65, 200, 365];
const PREFERRED_T = [90, 120, 180, 270, 365];

const inputClass = "site-input px-3 py-2 text-sm";

export function ControlPanel({
  meta,
  params,
  data,
  loading,
  onParamsChange,
  onAnalyze,
}: Props) {
  const hOptions = [
    ...PREFERRED_H.filter((h) => meta.grid.H_days.includes(h)),
    ...meta.grid.H_days.filter((h) => !PREFERRED_H.includes(h)),
  ];
  const tOptions = [
    ...PREFERRED_T.filter((t) => meta.grid.T_days.includes(t)),
    ...meta.grid.T_days.filter((t) => !PREFERRED_T.includes(t)),
  ];

  const sideClass =
    data?.side === "long"
      ? "border-[var(--color-emerald)]/40 bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]"
      : data?.side === "short"
        ? "border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 text-[var(--color-rose)]"
        : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]";

  return (
    <div className="relative mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <div className="site-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-amber)]">
              Plots
            </p>
            <h1 className="font-display text-xl font-medium text-[var(--color-text-primary)]">
              Interactive explorer
            </h1>
          </div>
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            Data through {meta.date_max}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
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

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            H (days)
            <select
              className={`w-28 ${inputClass}`}
              value={params.H}
              onChange={(e) => onParamsChange({ H: Number(e.target.value) })}
            >
              {hOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            T (days)
            <select
              className={`w-28 ${inputClass}`}
              value={params.T}
              onChange={(e) => onParamsChange({ T: Number(e.target.value) })}
            >
              {tOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
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

          <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
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

          <label className="flex min-w-[180px] flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
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
            className="site-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            onClick={() => onAnalyze()}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {data && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${sideClass}`}
            >
              {data.side}
            </span>
            <span className="text-[var(--color-text-secondary)]">
              k = {data.k_today.toFixed(4)} ({formatMaRelation(data.relation, params.H)})
            </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              CP {(data.primary.cp * 100).toFixed(1)}% ({data.primary.hits}/
              {data.primary.occurrences})
            </span>
            <span className="text-[var(--color-text-secondary)]">
              Smoothed {(data.primary.smoothed_cp * 100).toFixed(1)}%
            </span>
            <span className="font-mono text-[var(--color-text-secondary)]">
              BTC ${data.price_today.toLocaleString()}
            </span>
            {data.resolved_date !== data.analysis_date && (
              <span className="text-xs text-[var(--color-amber)]">
                Resolved to {data.resolved_date}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
