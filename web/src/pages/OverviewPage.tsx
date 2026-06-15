import { OverviewNarrative } from "../components/OverviewNarrative";
import { AppFooter } from "../components/layout/AppFooter";
import { AppNavbar } from "../components/layout/AppNavbar";
import { useLanding } from "../hooks/useLanding";

export function OverviewPage() {
  const {
    data,
    loading,
    error,
    date,
    H,
    HOptions,
    dateBounds,
    setDate,
    setH,
  } = useLanding();

  const activeBlock = data?.by_H[0] ?? null;

  return (
    <div className="app-canvas min-h-screen">
      <AppNavbar />

      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-amber-dim)]">
            Overview
          </p>
          <h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-[var(--color-carbon)] sm:text-4xl">
            Today's historical context
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-graphite)]">
            How often Bitcoin rose or fell after past days that looked similar to your
            selected date — same position relative to a moving average.
          </p>
        </header>

        {dateBounds && date && (
          <div className="app-card mb-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--color-slate-ui)]">
                Analysis date
              </span>
              <input
                type="date"
                className="rounded-lg border border-[var(--color-chalk)] bg-[var(--color-fog)] px-3 py-2 text-sm text-[var(--color-carbon)] outline-none focus:border-[var(--color-amber)]"
                min={dateBounds.min}
                max={dateBounds.max}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[200px]">
              <span className="text-xs font-medium text-[var(--color-slate-ui)]">
                H — moving average (days)
              </span>
              <select
                className="rounded-lg border border-[var(--color-chalk)] bg-[var(--color-fog)] px-3 py-2 text-sm text-[var(--color-carbon)] outline-none focus:border-[var(--color-amber)]"
                value={H}
                onChange={(e) => setH(Number(e.target.value))}
              >
                {HOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading && (
          <div className="app-card flex items-center justify-center py-16">
            <p className="text-sm text-[var(--color-slate-ui)]">Loading analysis…</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {data && activeBlock && (
          <OverviewNarrative
            block={activeBlock}
            kWiggle={data.k_wiggle}
            priceToday={data.price_today}
            resolvedDate={data.resolved_date}
            analysisDate={data.analysis_date}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}
