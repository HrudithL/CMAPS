import { formatMaRelation } from "../lib/maRelation";
import type { AnalysisParams, AnalyzeResponse, MetaResponse } from "../types/analysis";

interface Props {
  meta: MetaResponse;
  params: AnalysisParams;
  data: AnalyzeResponse | null;
  loading: boolean;
  autoUpdate: boolean;
  onParamsChange: (patch: Partial<AnalysisParams>) => void;
  onAnalyze: () => void;
  onAutoUpdateChange: (value: boolean) => void;
}

export function ControlPanel({
  meta,
  params,
  data,
  loading,
  autoUpdate,
  onParamsChange,
  onAnalyze,
  onAutoUpdateChange,
}: Props) {
  const sideClass =
    data?.side === "long"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : data?.side === "short"
        ? "bg-red-100 text-red-800 border-red-300"
        : "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">CPMAB</h1>
            <p className="text-sm text-slate-500">
              Conditional Probability with Moving Averages on Bitcoin
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Data through {meta.date_max}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Analysis date
            <input
              type="date"
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
              min={meta.date_min}
              max={meta.date_max}
              value={params.date}
              onChange={(e) => onParamsChange({ date: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            H (days)
            <input
              type="number"
              min={1}
              max={2000}
              className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={params.H}
              onChange={(e) => onParamsChange({ H: Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            T (days)
            <input
              type="number"
              min={1}
              max={2000}
              className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={params.T}
              onChange={(e) => onParamsChange({ T: Number(e.target.value) })}
            />
          </label>

          <label className="flex min-w-[180px] flex-col gap-1 text-xs font-medium text-slate-600">
            k wiggle ±{params.k_wiggle.toFixed(3)}
            <input
              type="range"
              min={0.001}
              max={0.15}
              step={0.001}
              value={params.k_wiggle}
              onChange={(e) =>
                onParamsChange({ k_wiggle: Number(e.target.value) })
              }
            />
          </label>

          <label className="flex items-center gap-2 pb-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => onAutoUpdateChange(e.target.checked)}
            />
            Auto-update
          </label>

          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={onAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {data && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${sideClass}`}
            >
              {data.side}
            </span>
            <span className="text-slate-600">
              k = {data.k_today.toFixed(4)} ({formatMaRelation(data.relation, params.H)})
            </span>
            <span className="font-medium text-slate-900">
              CP {(data.primary.cp * 100).toFixed(1)}% ({data.primary.hits}/
              {data.primary.occurrences})
            </span>
            <span className="text-slate-600">
              BTC ${data.price_today.toLocaleString()}
            </span>
            {data.resolved_date !== data.analysis_date && (
              <span className="text-amber-700 text-xs">
                Resolved to {data.resolved_date}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
