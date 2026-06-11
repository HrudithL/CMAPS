import { Navbar } from "../components/Navbar";
import { useLanding } from "../hooks/useLanding";
import type { LandingHBlock, SideCp } from "../types/landing";

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatCp(side: SideCp, variant: "long" | "short") {
  if (side.occurrences === 0) return "—";
  const pct = (side.cp * 100).toFixed(1);
  const aSet = variant === "long" ? "A_long" : "A_short";
  const bSet = variant === "long" ? "B_long" : "B_short";
  return `${pct}% (|${aSet}|/|${bSet}| = ${side.hits}/${side.occurrences})`;
}

function HBlock({ block }: { block: LandingHBlock }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">
        H = {block.H} days
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        k<sub>{block.H}</sub> = {block.k.toFixed(4)}{" "}
        <span className="text-slate-400">
          (MA = {formatPrice(block.ma)}, price {block.relation} MA)
        </span>
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-1.5 pr-4 font-medium">T (days)</th>
              <th className="py-1.5 pr-4 font-medium">
                CP long
                <span className="mt-0.5 block text-[10px] font-normal normal-case text-slate-400">
                  |A_long|/|B_long|
                </span>
              </th>
              <th className="py-1.5 font-medium">
                CP short
                <span className="mt-0.5 block text-[10px] font-normal normal-case text-slate-400">
                  |A_short|/|B_short|
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.by_T.map((row) => (
              <tr key={row.T} className="border-b border-slate-100">
                <td className="py-1.5 pr-4 tabular-nums">{row.T}</td>
                <td className="py-1.5 pr-4 tabular-nums text-emerald-700">
                  {formatCp(row.long, "long")}
                </td>
                <td className="py-1.5 tabular-nums text-rose-700">
                  {formatCp(row.short, "short")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

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

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="mb-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Conditional probabilities for BTC analog dates matching today&apos;s
              price-to-MA ratio.
            </p>
          </div>

          {dateBounds && date && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-600 sm:min-w-[160px] sm:flex-none">
                Analysis date
                <input
                  type="date"
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  min={dateBounds.min}
                  max={dateBounds.max}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-600 sm:min-w-[140px] sm:flex-none">
                H (days)
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
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
        </div>

        {loading && (
          <p className="text-center text-sm text-slate-500">Loading…</p>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">
                BTC price on {data.resolved_date}
              </h3>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {formatPrice(data.price_today)}
              </p>
              {data.resolved_date !== data.analysis_date && (
                <p className="mt-1 text-xs text-amber-700">
                  Requested {data.analysis_date}; resolved to nearest trading day
                </p>
              )}
            </div>

            {activeBlock ? (
              <HBlock block={activeBlock} />
            ) : (
              <p className="text-sm text-slate-500">
                No data for H = {H} on this date.
              </p>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Historical analog analysis only. Not financial advice.
      </footer>
    </div>
  );
}
