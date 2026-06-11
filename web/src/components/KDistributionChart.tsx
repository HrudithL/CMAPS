import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { KDistributionPayload } from "../types/analysis";

interface Props {
  distribution: KDistributionPayload;
}

export function KDistributionChart({ distribution }: Props) {
  const { histogram, k_today, k_wiggle, H, within_wiggle, total_history } = distribution;

  const traces = useMemo(() => {
    const centers = histogram.map((b) => (b.start + b.end) / 2);
    const widths = histogram.map((b) => b.end - b.start);

    const result: Data[] = [
      {
        x: centers,
        y: histogram.map((b) => b.count),
        type: "bar",
        name: "Historical k",
        marker: { color: "#94a3b8" },
        width: widths,
        hovertemplate: "k %{x:.4f}<br>count %{y}<extra></extra>",
      },
    ];

    return result;
  }, [histogram]);

  const wiggleShapes = [
    {
      type: "rect" as const,
      xref: "x" as const,
      yref: "paper" as const,
      x0: k_today - k_wiggle,
      x1: k_today + k_wiggle,
      y0: 0,
      y1: 1,
      fillcolor: "rgba(34, 197, 94, 0.15)",
      line: { width: 0 },
    },
    {
      type: "line" as const,
      x0: k_today,
      x1: k_today,
      y0: 0,
      y1: 1,
      yref: "paper" as const,
      line: { color: "#111827", width: 2, dash: "dash" },
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Today&apos;s k vs historical k (H = {H})
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {within_wiggle.toLocaleString()} of {total_history.toLocaleString()} prior days within k ±{" "}
        {k_wiggle} of today ({k_today.toFixed(4)}).
      </p>
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 360,
          margin: { l: 50, r: 20, t: 10, b: 50 },
          shapes: wiggleShapes,
          xaxis: { title: { text: "k = price / MA(H)" } },
          yaxis: { title: { text: "Day count" } },
          bargap: 0.05,
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="w-full"
      />
      <p className="mt-2 text-xs text-slate-500">
        Dashed line = k today. Green band = ±k wiggle match window.
      </p>
    </section>
  );
}
