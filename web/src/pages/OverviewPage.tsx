import { OverviewNarrative } from "../components/OverviewNarrative";
import { AppFooter } from "../components/layout/AppFooter";
import { SiteNavbar } from "../components/layout/SiteNavbar";
import { useLanding } from "../hooks/useLanding";

const HIGHLIGHT_H = [65, 200, 365];

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

  const activeBlock = data?.by_H.find((block) => block.H === H) ?? data?.by_H[0] ?? null;

  return (
    <div className="site-canvas">
      <div className="site-grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <SiteNavbar />

      <main className="relative mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-amber)]">
            Overview
          </p>
          <h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Today's historical context
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            How often Bitcoin rose or fell after past days that looked similar to your
            selected date — same position relative to a moving average.
          </p>
        </header>

        {dateBounds && date && (
          <div className="site-card mb-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Analysis date
              </span>
              <input
                type="date"
                className="site-input px-3 py-2 text-sm"
                min={dateBounds.min}
                max={dateBounds.max}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[200px]">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                H — moving average (days)
              </span>
              <select
                className="site-input px-3 py-2 text-sm"
                value={H}
                onChange={(e) => setH(Number(e.target.value))}
              >
                {HOptions.filter((value) => HIGHLIGHT_H.includes(value)).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
                {HOptions.filter((value) => !HIGHLIGHT_H.includes(value)).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading && (
          <div className="site-card flex items-center justify-center py-16">
            <p className="text-sm text-[var(--color-text-muted)]">Loading analysis…</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-4 py-3 text-sm text-[var(--color-rose)]">
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
