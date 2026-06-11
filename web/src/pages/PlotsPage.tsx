import { useState } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { Navbar } from "../components/Navbar";
import { CpCurveChart } from "../components/CpCurveChart";
import { CpHeatmap } from "../components/CpHeatmap";
import { KWiggleChart } from "../components/KWiggleChart";
import { PriceContextChart } from "../components/PriceContextChart";
import { StrategyInspector } from "../components/StrategyInspector";
import { StrategyTable } from "../components/StrategyTable";
import { useAnalysis } from "../hooks/useAnalysis";
import type { StrategyResult } from "../types/analysis";

export function PlotsPage() {
  const {
    meta,
    data,
    params,
    loading,
    error,
    autoUpdate,
    setAutoUpdate,
    updateParams,
    analyzeNow,
  } = useAnalysis();

  const [inspector, setInspector] = useState<StrategyResult | null>(null);

  if (!meta || !params) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading dashboard…
      </div>
    );
  }

  const openStrategy = (row: StrategyResult) => setInspector(row);

  const openFromHeatmap = (H: number, T: number, side: string) => {
    if (!data) return;
    openStrategy({
      H,
      T,
      side,
      k_today: data.k_today,
      relation: data.relation,
      hits: 0,
      occurrences: 0,
      cp: 0,
      forward_resolved: data.primary.forward_resolved,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <ControlPanel
        meta={meta}
        params={params}
        data={data}
        loading={loading}
        autoUpdate={autoUpdate}
        onParamsChange={updateParams}
        onAnalyze={analyzeNow}
        onAutoUpdateChange={setAutoUpdate}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && !data && (
          <p className="text-center text-sm text-slate-500">Running analysis…</p>
        )}

        {data && (
          <>
            <PriceContextChart data={data} kWiggle={params.k_wiggle} />

            <div className="grid gap-6 lg:grid-cols-2">
              <CpCurveChart data={data} axis="T" />
              <CpCurveChart data={data} axis="H" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <KWiggleChart data={data} side="long" />
              <KWiggleChart data={data} side="short" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <CpHeatmap
                data={data}
                side="long"
                onCellClick={(s) => openFromHeatmap(s.H, s.T, "long")}
              />
              <CpHeatmap
                data={data}
                side="short"
                onCellClick={(s) => openFromHeatmap(s.H, s.T, "short")}
              />
            </div>

            <StrategyTable
              title="Top 10 strategies overall"
              rows={data.top_strategies}
              onRowClick={openStrategy}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Historical analog analysis only. Not financial advice.
      </footer>

      {inspector && params && (
        <StrategyInspector
          params={params}
          strategy={inspector}
          onClose={() => setInspector(null)}
        />
      )}
    </div>
  );
}
