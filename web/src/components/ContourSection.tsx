import { useMemo, useState } from "react";
import Plot from "react-plotly.js";
import type { Data, Layout, Shape } from "plotly.js";
import { CP_DIVERGING_SCALE } from "../lib/colorscales";
import { PLOTLY_PAN_ZOOM_CONFIG, PLOTLY_PAN_ZOOM_LAYOUT } from "../lib/plotlyConfig";
import type { ContourPayload } from "../types/analysis";

interface Props {
  contour: ContourPayload;
  selectedH: number;
  selectedT: number;
}

type SurfaceMode = "cp" | "smoothed_cp";

function snapToGrid(value: number, grid: number[]): number {
  if (grid.length === 0) return value;
  let best = grid[0];
  let bestDist = Math.abs(value - best);
  for (const g of grid) {
    const dist = Math.abs(value - g);
    if (dist < bestDist) {
      best = g;
      bestDist = dist;
    }
  }
  return best;
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
    line: { color: "#334155", width: 1, dash: "dot" },
  }));
}

function gridIndex(grid: number[], value: number): number {
  const snapped = snapToGrid(value, grid);
  const idx = grid.indexOf(snapped);
  return idx >= 0 ? idx : 0;
}

export function ContourSection({ contour, selectedH, selectedT }: Props) {
  const [mode, setMode] = useState<SurfaceMode>("cp");
  const { smoothing } = contour;

  const snappedH = snapToGrid(selectedH, contour.H_values);
  const snappedT = snapToGrid(selectedT, contour.T_values);

  const zMatrix = mode === "cp" ? contour.cp : contour.smoothed_cp;
  const modeLabel = mode === "cp" ? "Conditional probability" : "Smoothed CP";

  const shapes = useMemo(() => boundaryShapes(contour), [contour]);

  const highlightValue = useMemo(() => {
    const hi = gridIndex(contour.H_values, snappedH);
    const ti = gridIndex(contour.T_values, snappedT);
    return zMatrix[hi]?.[ti] ?? null;
  }, [contour.H_values, contour.T_values, snappedH, snappedT, zMatrix]);

  const traces = useMemo((): Data[] => {
    const heatmap: Data = {
      x: contour.T_values,
      y: contour.H_values,
      z: zMatrix,
      type: "heatmap",
      colorscale: CP_DIVERGING_SCALE,
      zmin: 0,
      zmax: 1,
      zsmooth: "best",
      hovertemplate:
        "H %{y}<br>T %{x}<br>" +
        (mode === "cp" ? "CP" : "Smoothed CP") +
        " %{z:.1%}<extra></extra>",
      colorbar: {
        title: { text: mode === "cp" ? "CP" : "Smoothed CP" },
        tickformat: ".0%",
        len: 0.9,
        thickness: 14,
      },
    };

    const marker: Data = {
      x: [snappedT],
      y: [snappedH],
      type: "scatter",
      mode: "markers",
      hovertemplate:
        `Selected H=${snappedH}, T=${snappedT}` +
        (highlightValue != null ? `<br>${modeLabel} ${(highlightValue * 100).toFixed(1)}%` : "") +
        "<extra></extra>",
      marker: {
        size: 16,
        color: "#ffffff",
        symbol: "circle",
        line: { width: 3, color: "#0f172a" },
      },
    };

    return [heatmap, marker];
  }, [contour.H_values, contour.T_values, highlightValue, mode, modeLabel, snappedH, snappedT, zMatrix]);

  const layout = useMemo(
    (): Partial<Layout> => ({
      ...PLOTLY_PAN_ZOOM_LAYOUT,
      autosize: true,
      height: 480,
      margin: { l: 64, r: 48, t: 12, b: 52 },
      xaxis: {
        title: { text: "T (days)" },
        constrain: "domain",
      },
      yaxis: {
        title: { text: "H (days)" },
        autorange: "reversed",
        constrain: "domain",
      },
      shapes,
      showlegend: false,
      hovermode: "closest",
    }),
    [shapes],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Strategy surface</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Active side per H (long below MA, short above). Dotted line = long/short
            boundary. White dot marks your selected H and T from the analyze bar (snapped
            to nearest grid cell).
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Surface
            <select
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as SurfaceMode)}
            >
              <option value="cp">Conditional probability</option>
              <option value="smoothed_cp">Smoothed CP</option>
            </select>
          </label>
        </div>
      </div>

      <div className="w-full" style={{ height: 480 }}>
        <Plot
          key={`${mode}-${smoothing.m}-${smoothing.r}`}
          data={traces}
          layout={layout}
          config={PLOTLY_PAN_ZOOM_CONFIG}
          useResizeHandler
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Drag to pan, scroll to zoom, double-click to reset. Using m = {smoothing.m} (default{" "}
        {smoothing.m_default}), r = {(smoothing.r * 100).toFixed(1)}% (default{" "}
        {(smoothing.r_default * 100).toFixed(1)}%).
      </p>
    </section>
  );
}
