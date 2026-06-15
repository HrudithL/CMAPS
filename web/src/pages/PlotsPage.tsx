import { lazy, Suspense, useState } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { AppFooter } from "../components/layout/AppFooter";
import { SiteNavbar } from "../components/layout/SiteNavbar";
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
    <div className="site-card flex h-[440px] items-center justify-center text-sm text-[var(--color-text-muted)]">
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
      <div className="site-canvas flex min-h-screen items-center justify-center text-[var(--color-text-secondary)]">
        Loading dashboard…
      </div>
    );
  }

  const openStrategy = (row: StrategyResult) => setInspector(row);

  return (
    <div className="site-canvas">
      <div className="site-grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <SiteNavbar />

      <ControlPanel
        meta={meta}
        params={params}
        data={data}
        loading={loading}
        onParamsChange={updateParams}
        onAnalyze={analyzeNow}
      />

      <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-xl border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-4 py-3 text-sm text-[var(--color-rose)]">
            {error}
          </div>
        )}

        {loading && !data && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">Running analysis…</p>
        )}

        {!loading && !data && !error && (
          <div className="site-card py-16 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
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
