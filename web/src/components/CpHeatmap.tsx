import Plot from "react-plotly.js";
import type { PlotMouseEvent } from "plotly.js";
import type { AnalyzeResponse, StrategyResult } from "../types/analysis";

interface Props {
  data: AnalyzeResponse;
  side: "long" | "short";
  onCellClick?: (strategy: Pick<StrategyResult, "H" | "T" | "side">) => void;
}

export function CpHeatmap({ data, side, onCellClick }: Props) {
  const { H_values, T_values, highlight } = data.heatmap;
  const matrix = side === "long" ? data.heatmap.long : data.heatmap.short;
  const occurrences = data.heatmap.occurrences;

  const text = matrix.map((row, i) =>
    row.map((cp, j) => {
      const n = occurrences[i]?.[j];
      if (cp === null || cp === undefined) {
        return n != null ? `n=${n}` : "";
      }
      return `${(cp * 100).toFixed(0)}%\n(n=${n})`;
    }),
  );

  const hi = highlight;
  const hiHIdx = H_values.indexOf(hi.H);
  const hiTIdx = T_values.indexOf(hi.T);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        {side === "long" ? "Long" : "Short"} CP heatmap
      </h2>
      <Plot
        data={[
          {
            z: matrix,
            x: T_values,
            y: H_values,
            text,
            texttemplate: "%{text}",
            textfont: { size: 9 },
            type: "heatmap",
            colorscale: "RdYlGn",
            zmin: 0,
            zmax: 1,
            hovertemplate:
              "H=%{y}, T=%{x}<br>CP=%{z:.1%}<extra></extra>",
          },
        ]}
        layout={{
          autosize: true,
          height: 420,
          margin: { l: 60, r: 20, t: 10, b: 60 },
          xaxis: { title: "T (days)" },
          yaxis: { title: "H (days)", autorange: "reversed" },
          shapes:
            hiHIdx >= 0 && hiTIdx >= 0
              ? [
                  {
                    type: "rect",
                    x0: hiTIdx - 0.5,
                    x1: hiTIdx + 0.5,
                    y0: hiHIdx - 0.5,
                    y1: hiHIdx + 0.5,
                    line: { color: "#000", width: 3 },
                    fillcolor: "rgba(0,0,0,0)",
                  },
                ]
              : [],
        }}
        config={{ responsive: true, displayModeBar: false }}
        onClick={(ev: PlotMouseEvent) => {
          if (!onCellClick || !ev.points?.[0]) return;
          const pt = ev.points[0];
          onCellClick({
            H: Number(pt.y),
            T: Number(pt.x),
            side,
          });
        }}
        useResizeHandler
        className="min-w-[480px] w-full"
      />
    </section>
  );
}
