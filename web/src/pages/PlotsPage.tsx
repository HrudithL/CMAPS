import { useState } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { ContourSection } from "../components/ContourSection";
import { KDistributionChart } from "../components/KDistributionChart";
import { Navbar } from "../components/Navbar";
import { PriceMaChart } from "../components/PriceMaChart";
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
            <PriceMaChart data={data} maOptions={meta.grid.H_days} />

            <ContourSection contour={data.contour} />

            <StrategyTable
              H={params.H}
              k={data.k_today}
              relation={data.relation}
              rows={data.top_strategies}
              onRowClick={openStrategy}
            />

            <KDistributionChart distribution={data.k_distribution} />
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
