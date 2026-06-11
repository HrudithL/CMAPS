import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { AnalyzeResponse } from "../types/analysis";

interface Props {
  data: AnalyzeResponse;
  side: "long" | "short";
}

export function KWiggleChart({ data, side }: Props) {
  const lines = data.k_wiggle_sweep[side];
  const title = `Top ${side} strategies — CP vs k wiggle`;

  const traces: Data[] = lines.map((line) => ({
    x: line.points.map((p) => p.k),
    y: line.points.map((p) => p.cp * 100),
    type: "scatter",
    mode: "lines+markers",
    name: line.primary
      ? `H=${line.H}, T=${line.T} (primary)`
      : `H=${line.H}, T=${line.T}`,
    line: { width: line.primary ? 2.5 : 1.2 },
    marker: { size: 3 },
  }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2>
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 340,
          margin: { l: 50, r: 20, t: 10, b: 50 },
          xaxis: {
            title: "k wiggle (±)",
            type: "log",
            autorange: "reversed",
          },
          yaxis: { title: "CP (%)", range: [0, 100] },
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="w-full"
      />
    </section>
  );
}
