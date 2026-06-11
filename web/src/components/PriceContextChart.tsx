import { useMemo, useState } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { AnalyzeResponse } from "../types/analysis";

interface Props {
  data: AnalyzeResponse;
  kWiggle: number;
}

type Filter = "all" | "hits" | "misses";

export function PriceContextChart({ data, kWiggle }: Props) {
  const [showAllMas, setShowAllMas] = useState(false);
  const { price_context: ctx, analog_events: events, primary } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const [showPaths, setShowPaths] = useState(false);

  const filteredEvents = useMemo(() => {
    if (filter === "hits") return events.filter((e) => e.hit);
    if (filter === "misses") return events.filter((e) => !e.hit);
    return events;
  }, [events, filter]);

  const maWindows = showAllMas
    ? ctx.ma_windows
    : [ctx.primary_h ?? primary.H];

  const traces = useMemo(() => {
    const result: Data[] = [
      {
        x: ctx.series.map((p) => p.date),
        y: ctx.series.map((p) => p.price),
        type: "scatter",
        mode: "lines",
        name: "BTC price",
        line: { color: "#1f77b4", width: 1.5 },
      },
    ];

    for (const H of maWindows) {
      const key = `ma_${H}`;
      result.push({
        x: ctx.series.map((p) => p.date),
        y: ctx.series.map((p) => p[key] ?? null),
        type: "scatter",
        mode: "lines",
        name: `MA(${H})`,
        line: { dash: "dash", width: 1 },
      });
    }

    if (showPaths) {
      for (const e of filteredEvents) {
        result.push({
          x: [e.date, e.future_date],
          y: [e.price, e.price],
          type: "scatter",
          mode: "lines",
          line: { color: e.hit ? "#2ca02c44" : "#d6272844", width: 1 },
          showlegend: false,
          hoverinfo: "skip",
        });
      }
    }

    result.push({
      x: filteredEvents.map((e) => e.date),
      y: filteredEvents.map((e) => e.price),
      type: "scatter",
      mode: "markers",
      name: "Analog events",
      marker: {
        size: 9,
        color: filteredEvents.map((e) => (e.hit ? "#2ca02c" : "#d62728")),
        line: { color: "#fff", width: 1 },
      },
      text: filteredEvents.map(
        (e) =>
          `${e.date}<br>Price $${e.price.toLocaleString()}<br>k ${e.k.toFixed(4)}<br>MA $${e.ma.toLocaleString()}<br>Exit ${e.future_date}: $${e.future_price.toLocaleString()}<br>Return ${e.return_pct}%<br>${e.hit ? "Hit" : "Miss"}`,
      ),
      hoverinfo: "text",
    });

    return result;
  }, [ctx, filteredEvents, maWindows, showPaths]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Price context &amp; analog events
        </h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showAllMas}
              onChange={(e) => setShowAllMas(e.target.checked)}
            />
            Show all MAs
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showPaths}
              onChange={(e) => setShowPaths(e.target.checked)}
            />
            Show forward paths
          </label>
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="all">All analogs</option>
            <option value="hits">Hits only</option>
            <option value="misses">Misses only</option>
          </select>
        </div>
      </div>
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 420,
          margin: { l: 60, r: 20, t: 20, b: 50 },
          shapes: [
            {
              type: "line",
              x0: ctx.analysis_date,
              x1: ctx.analysis_date,
              y0: 0,
              y1: 1,
              yref: "paper",
              line: { color: "#000", dash: "dot", width: 1 },
            },
          ],
          xaxis: { title: "Date" },
          yaxis: { title: "USD", tickprefix: "$" },
          legend: { orientation: "h", y: 1.12 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        className="w-full"
        useResizeHandler
      />
      <p className="mt-2 text-xs text-slate-500">
        Green = hit, red = miss. {events.length} historical analog days for H=
        {primary.H}, T={primary.T}, k±{kWiggle}.
      </p>
    </section>
  );
}
