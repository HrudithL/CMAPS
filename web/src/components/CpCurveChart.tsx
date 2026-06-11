import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { AnalyzeResponse } from "../types/analysis";

interface Props {
  data: AnalyzeResponse;
  axis: "T" | "H";
}

export function CpCurveChart({ data, axis }: Props) {
  const block = axis === "T" ? data.cp_vs_T : data.cp_vs_H;
  const xKey = axis === "T" ? "T" : "H";
  const title =
    axis === "T"
      ? "Conditional probability vs T (forward window)"
      : "Conditional probability vs H (MA lookback)";

  const traces: Data[] = block.curves.map((curve) => ({
    x: curve.points.map((p) => p[xKey]!),
    y: curve.points.map((p) => p.cp * 100),
    type: "scatter",
    mode: "lines+markers",
    name: curve.label,
    line: {
      width: curve.primary ? 2.5 : 1.2,
      color: curve.primary ? undefined : "#888",
    },
    marker: { size: 4 },
    text: curve.points.map((p) => `CP ${(p.cp * 100).toFixed(1)}% (n=${p.n})`),
    hoverinfo: "text",
  }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 360,
          margin: { l: 50, r: 20, t: 10, b: 50 },
          xaxis: { title: axis === "T" ? "T (days)" : "H (days)" },
          yaxis: { title: "CP (%)", range: [0, 100] },
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        className="w-full"
      />
    </section>
  );
}
