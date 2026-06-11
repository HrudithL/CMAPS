import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { fetchStrategyDetail } from "../api/client";
import type {
  AnalysisParams,
  AnalogEvent,
  StrategyDetailResponse,
  StrategyResult,
} from "../types/analysis";

interface Props {
  params: AnalysisParams;
  strategy: StrategyResult;
  onClose: () => void;
}

type SortKey = keyof AnalogEvent;

export function StrategyInspector({ params, strategy, onClose }: Props) {
  const [detail, setDetail] = useState<StrategyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStrategyDetail({
      ...params,
      H: strategy.H,
      T: strategy.T,
      side: strategy.side,
    })
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params, strategy]);

  const sortedEvents = useMemo(() => {
    if (!detail) return [];
    return [...detail.analog_events].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [detail, sortKey, sortAsc]);

  const exportCsv = () => {
    if (!detail) return;
    const header =
      "date,price,ma,k,future_date,future_price,return_pct,hit";
    const rows = detail.analog_events.map(
      (e) =>
        `${e.date},${e.price},${e.ma},${e.k},${e.future_date},${e.future_price},${e.return_pct},${e.hit}`,
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analogs_H${strategy.H}_T${strategy.T}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold capitalize text-slate-900">
              {strategy.side} · H={strategy.H} · T={strategy.T} · CP{" "}
              {(strategy.cp * 100).toFixed(1)}% ({strategy.hits}/
              {strategy.occurrences}) · k±{params.k_wiggle}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm"
              onClick={exportCsv}
              disabled={!detail}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {detail?.forward_unresolved && (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Forward window extends beyond latest data; CP for today is
              historical analogs only.
            </p>
          )}

          {detail && (
            <>
              <Plot
                data={[
                  {
                    x: detail.analog_events.map((e) => e.date),
                    y: detail.analog_events.map((e) => e.price),
                    type: "scatter",
                    mode: "markers",
                    marker: {
                      size: 10,
                      color: detail.analog_events.map((e) =>
                        e.hit ? "#2ca02c" : "#d62728",
                      ),
                    },
                    text: detail.analog_events.map(
                      (e) =>
                        `${e.date} · ${e.hit ? "Hit" : "Miss"} · ${e.return_pct}%`,
                    ),
                    hoverinfo: "text",
                  },
                ]}
                layout={{
                  height: 280,
                  margin: { l: 50, r: 20, t: 10, b: 50 },
                  title: "Analog dates",
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                className="w-full"
              />

              {detail.stats.hits && (
                <p className="text-xs text-slate-600">
                  Hits: mean return {detail.stats.hits.mean}% (min{" "}
                  {detail.stats.hits.min}%, max {detail.stats.hits.max}%)
                  {detail.stats.misses &&
                    ` · Misses: mean ${detail.stats.misses.mean}%`}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-slate-500">
                      {(
                        [
                          ["date", "Date"],
                          ["price", "Price"],
                          ["ma", "MA(H)"],
                          ["k", "k"],
                          ["future_date", "Exit date"],
                          ["future_price", "Exit price"],
                          ["return_pct", "Return %"],
                          ["hit", "Outcome"],
                        ] as [SortKey, string][]
                      ).map(([key, label]) => (
                        <th
                          key={key}
                          className="cursor-pointer px-2 py-2"
                          onClick={() => toggleSort(key)}
                        >
                          {label}
                          {sortKey === key ? (sortAsc ? " ↑" : " ↓") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvents.map((e) => (
                      <tr key={e.date} className="border-b border-slate-100">
                        <td className="px-2 py-1">{e.date}</td>
                        <td className="px-2 py-1">${e.price.toLocaleString()}</td>
                        <td className="px-2 py-1">${e.ma.toLocaleString()}</td>
                        <td className="px-2 py-1">{e.k.toFixed(4)}</td>
                        <td className="px-2 py-1">{e.future_date}</td>
                        <td className="px-2 py-1">
                          ${e.future_price.toLocaleString()}
                        </td>
                        <td className="px-2 py-1">{e.return_pct}%</td>
                        <td
                          className={`px-2 py-1 font-medium ${e.hit ? "text-emerald-700" : "text-red-700"}`}
                        >
                          {e.hit ? "Hit" : "Miss"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
