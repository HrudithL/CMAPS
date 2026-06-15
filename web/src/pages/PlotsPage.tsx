import { lazy, Suspense, useState } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { AppFooter } from "../components/layout/AppFooter";
import { AppNavbar } from "../components/layout/AppNavbar";
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
    <div className="app-card flex h-[440px] items-center justify-center text-sm text-[var(--color-slate-ui)]">
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
      <div className="app-canvas flex min-h-screen items-center justify-center text-[var(--color-graphite)]">
        Loading dashboard…
      </div>
    );
  }

  const openStrategy = (row: StrategyResult) => setInspector(row);

  return (
    <div className="app-canvas min-h-screen">
      <AppNavbar />

      <ControlPanel
        meta={meta}
        params={params}
        data={data}
        loading={loading}
        onParamsChange={updateParams}
        onAnalyze={analyzeNow}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading && !data && (
          <p className="text-center text-sm text-[var(--color-slate-ui)]">Running analysis…</p>
        )}

        {!loading && !data && !error && (
          <div className="app-card py-16 text-center">
            <p className="text-sm text-[var(--color-slate-ui)]">
              Set parameters above and click Analyze to load charts.
            </p>
          </div>
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

      <AppFooter />

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
