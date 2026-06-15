import { useEffect, useMemo, useState } from "react";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { fetchStrategyDetail } from "../api/client";
import { buildNivoTheme, CHART_PALETTE, NIVO_MOTION } from "../lib/nivoTheme";
import { useTheme } from "../context/ThemeContext";
import { ChartFrame } from "./charts/ChartFrame";
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
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
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

  const scatterData = useMemo(() => {
    if (!detail) return [];
    return [
      {
        id: "analogs",
        data: detail.analog_events.map((e) => ({
          x: e.date,
          y: e.price,
          hit: e.hit,
          return_pct: e.return_pct,
        })),
      },
    ];
  }, [detail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card-bg)] px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-medium capitalize text-[var(--color-text-primary)]">
              {strategy.side} · H={strategy.H} · T={strategy.T} · CP{" "}
              {(strategy.cp * 100).toFixed(1)}% ({strategy.hits}/{strategy.occurrences}) · k±
              {params.k_wiggle}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="site-btn-outline px-3 py-1 text-sm"
              onClick={exportCsv}
              disabled={!detail}
            >
              Export CSV
            </button>
            <button type="button" className="site-btn-primary px-3 py-1 text-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
          {error && <p className="text-sm text-[var(--color-rose)]">{error}</p>}
          {detail?.forward_unresolved && (
            <p className="rounded border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 px-3 py-2 text-sm text-[var(--color-amber-glow)]">
              Forward window extends beyond latest data; CP for today is historical analogs only.
            </p>
          )}

          {detail && (
            <>
              <ChartFrame height={280}>
                <ResponsiveScatterPlot
                  key={theme}
                  data={scatterData}
                  theme={nivoTheme}
                  {...NIVO_MOTION}
                  margin={{ top: 16, right: 16, bottom: 56, left: 64 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: "auto", max: "auto" }}
                  axisBottom={{
                    tickSize: 0,
                    tickPadding: 8,
                    tickRotation: -35,
                  }}
                  axisLeft={{
                    tickSize: 0,
                    tickPadding: 8,
                    format: (v) => `$${Math.round(Number(v) / 1000)}k`,
                  }}
                  colors={[CHART_PALETTE.indigo]}
                  nodeSize={11}
                  nodeComponent={({ node }) => {
                    const hit = (node.data as { hit?: boolean }).hit;
                    return (
                      <g transform={`translate(${node.x},${node.y})`}>
                        <circle
                          r={9}
                          fill={hit ? CHART_PALETTE.hit : CHART_PALETTE.miss}
                          fillOpacity={0.85}
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  }}
                  tooltip={({ node }) => {
                    const d = node.data as {
                      x: string;
                      y: number;
                      hit: boolean;
                      return_pct: number;
                    };
                    return (
                      <div className="font-mono text-[11px]">
                        {d.x}
                        <br />${d.y.toLocaleString()} · {d.hit ? "Hit" : "Miss"} · {d.return_pct}%
                      </div>
                    );
                  }}
                />
              </ChartFrame>

              {detail.stats.hits && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Hits: mean return {detail.stats.hits.mean}% (min{" "}
                  {detail.stats.hits.min}%, max {detail.stats.hits.max}%)
                  {detail.stats.misses &&
                    ` · Misses: mean ${detail.stats.misses.mean}%`}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-text-muted)]">
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
                      <tr key={e.date} className="border-b border-[var(--color-border)]">
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
                          className={`px-2 py-1 font-medium ${e.hit ? "text-[var(--color-emerald)]" : "text-[var(--color-rose)]"}`}
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
