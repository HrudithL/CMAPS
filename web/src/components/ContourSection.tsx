import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data, Layout, Shape } from "plotly.js";
import type { ContourPayload } from "../types/analysis";

interface Props {
  contour: ContourPayload;
}

function boundaryShapes(contour: ContourPayload): Partial<Shape>[] {
  const tMin = contour.T_values[0];
  const tMax = contour.T_values[contour.T_values.length - 1];
  return contour.boundary_h.map((h) => ({
    type: "line" as const,
    x0: tMin,
    x1: tMax,
    y0: h,
    y1: h,
    line: { color: "#111827", width: 2, dash: "solid" },
  }));
}

function highlightTrace(contour: ContourPayload): Data {
  const { H, T } = contour.highlight;
  return {
    x: [T],
    y: [H],
    type: "scatter",
    mode: "markers",
    name: "Selected",
    marker: {
      size: 14,
      color: "#111827",
      symbol: "circle-open",
      line: { width: 3, color: "#111827" },
    },
    hovertemplate: `H=%{y}, T=%{x}<extra></extra>`,
  };
}

function StatsPanel({ stats }: { stats: ContourPayload["highlight_stats"] }) {
  if (!stats) {
    return (
      <div className="flex h-full min-h-[360px] flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No stats for selected H/T.
      </div>
    );
  }

  const sideLabel = stats.side === "long" ? "Long" : "Short";
  const sideClass =
    stats.side === "long"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Selected strategy</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">H</dt>
          <dd className="font-medium tabular-nums">{stats.H} days</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">T</dt>
          <dd className="font-medium tabular-nums">{stats.T} days</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Side</dt>
          <dd>
            <span className={`rounded border px-2 py-0.5 text-xs font-medium ${sideClass}`}>
              {sideLabel}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">CP</dt>
          <dd className="font-medium tabular-nums">{(stats.cp * 100).toFixed(1)}%</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Hits / n</dt>
          <dd className="font-medium tabular-nums">
            {stats.hits} / {stats.occurrences}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">k today</dt>
          <dd className="font-medium tabular-nums">{stats.k_today.toFixed(4)}</dd>
        </div>
        {!stats.forward_resolved && (
          <p className="text-xs text-amber-700">Forward window not yet resolved.</p>
        )}
      </dl>
      {boundaryNote(contourBoundaryHint(stats.side))}
    </div>
  );
}

function contourBoundaryHint(side: string) {
  return side === "long"
    ? "Long region: price below MA(H) on analysis date."
    : "Short region: price above MA(H) on analysis date.";
}

function boundaryNote(text: string) {
  return <p className="mt-4 text-xs text-slate-500">{text}</p>;
}

export function ContourSection({ contour }: Props) {
  const shapes = useMemo(() => boundaryShapes(contour), [contour]);
  const hi = highlightTrace(contour);

  const cpTraces: Data[] = useMemo(
    () => [
      {
        x: contour.T_values,
        y: contour.H_values,
        z: contour.cp,
        type: "contour",
        colorscale: "RdYlGn",
        zmin: 0,
        zmax: 1,
        colorbar: { title: { text: "CP" }, tickformat: ".0%" },
        contours: { coloring: "heatmap", showlabels: true, labelfont: { size: 10 } },
        hovertemplate: "H=%{y}, T=%{x}<br>CP=%{z:.1%}<extra></extra>",
        name: "CP",
      },
      hi,
    ],
    [contour, hi],
  );

  const nTraces: Data[] = useMemo(
    () => [
      {
        x: contour.T_values,
        y: contour.H_values,
        z: contour.occurrences,
        type: "contour",
        colorscale: "Blues",
        colorbar: { title: { text: "n" } },
        contours: { coloring: "heatmap", showlabels: true, labelfont: { size: 10 } },
        hovertemplate: "H=%{y}, T=%{x}<br>n=%{z}<extra></extra>",
        name: "n",
      },
      hi,
    ],
    [contour, hi],
  );

  const baseLayout: Partial<Layout> = {
    autosize: true,
    height: 400,
    margin: { l: 60, r: 40, t: 10, b: 50 },
    xaxis: { title: { text: "T (days)" } },
    yaxis: { title: { text: "H (days)" } },
    shapes,
    showlegend: false,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_11rem]">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Conditional probability</h2>
        <p className="mb-2 text-xs text-slate-500">
          Active side per H (long below MA, short above). Black line = long/short boundary.
        </p>
        <Plot
          data={cpTraces}
          layout={baseLayout}
          config={{ responsive: true, displayModeBar: false }}
          useResizeHandler
          className="min-w-[280px] w-full"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Sample size (n)</h2>
        <p className="mb-2 text-xs text-slate-500">Historical analog count at each (H, T).</p>
        <Plot
          data={nTraces}
          layout={baseLayout}
          config={{ responsive: true, displayModeBar: false }}
          useResizeHandler
          className="min-w-[280px] w-full"
        />
      </section>

      <StatsPanel stats={contour.highlight_stats} />
    </div>
  );
}
