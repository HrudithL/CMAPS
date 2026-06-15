import { Navbar } from "../components/Navbar";
import { OverviewNarrative } from "../components/OverviewNarrative";
import { useLanding } from "../hooks/useLanding";

export function LandingPage() {
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {dateBounds && date && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:gap-6">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-slate-600 sm:max-w-xs">
              <span className="shrink-0">Analysis date</span>
              <input
                type="date"
                className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                min={dateBounds.min}
                max={dateBounds.max}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-slate-600 sm:max-w-[200px]">
              <span className="shrink-0">H (days)</span>
              <select
                className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
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

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          <p className="mt-1 text-sm text-slate-600">
            How often Bitcoin rose or fell after past days that looked similar to your
            selected date.
          </p>
        </div>

        {loading && (
          <p className="text-center text-sm text-slate-500">Loading…</p>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Historical analog analysis only. Not financial advice.
      </footer>
    </div>
  );
}
