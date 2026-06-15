import { lazy, Suspense, useState } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { Navbar } from "../components/Navbar";
import { StrategyInspector } from "../components/StrategyInspector";
import { StrategyTable } from "../components/StrategyTable";
import { useAnalysis } from "../hooks/useAnalysis";
import type { StrategyResult } from "../types/analysis";

const PriceMaChart = lazy(() =>
  import("../components/PriceMaChart").then((m) => ({ default: m.PriceMaChart })),
);
const ContourSection = lazy(() =>
  import("../components/ContourSection").then((m) => ({ default: m.ContourSection })),
);
const KDistributionChart = lazy(() =>
  import("../components/KDistributionChart").then((m) => ({ default: m.KDistributionChart })),
);

function ChartFallback() {
  return (
    <div className="flex h-[440px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Rendering chart…
    </div>
  );
}

export function PlotsPage() {
  const {
    meta,
    data,
    params,
    loading,
    error,
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
        onParamsChange={updateParams}
        onAnalyze={analyzeNow}
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

        {!loading && !data && !error && (
          <p className="text-center text-sm text-slate-500">
            Set parameters and click Analyze to load charts.
          </p>
        )}

        {data && (
          <>
            <Suspense fallback={<ChartFallback />}>
              <PriceMaChart data={data} maOptions={meta.grid.H_days} />
            </Suspense>

            <Suspense fallback={<ChartFallback />}>
              <ContourSection
                contour={data.contour}
                selectedH={params.H}
                selectedT={params.T}
              />
            </Suspense>

            <StrategyTable
              H={params.H}
              k={data.k_today}
              relation={data.relation}
              rows={data.top_strategies}
              onRowClick={openStrategy}
            />

            <Suspense fallback={<ChartFallback />}>
              <KDistributionChart distribution={data.k_distribution} />
            </Suspense>
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
