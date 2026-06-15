import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data, Layout } from "plotly.js";
import { PLOTLY_PAN_ZOOM_CONFIG, PLOTLY_PAN_ZOOM_LAYOUT } from "../lib/plotlyConfig";
import type { KDistributionPayload } from "../types/analysis";

interface Props {
  distribution: KDistributionPayload;
}

const HIST_BINS = 40;

function buildHistogram(kValues: number[], bins: number) {
  if (kValues.length === 0) {
    return { centers: [] as number[], counts: [] as number[], width: 0 };
  }
  const min = Math.min(...kValues);
  const max = Math.max(...kValues);
  const width = (max - min) / bins || 1;
  const counts = new Array<number>(bins).fill(0);
  for (const k of kValues) {
    let idx = Math.floor((k - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  }
  const centers = counts.map((_, i) => min + (i + 0.5) * width);
  return { centers, counts, width };
}

export function KDistributionChart({ distribution }: Props) {
  const { k_values, k_today, k_wiggle, H, within_wiggle, total_history } = distribution;

  const histogram = useMemo(
    () => buildHistogram(k_values, HIST_BINS),
    [k_values],
  );

  const maxCount = useMemo(
    () => (histogram.counts.length ? Math.max(...histogram.counts) : 0),
    [histogram.counts],
  );

  const traces = useMemo((): Data[] => {
    const labelText = histogram.counts.map((c) => (c > 0 ? String(c) : ""));

    return [
      {
        type: "box",
        x: k_values,
        name: "Historical k",
        orientation: "h",
        boxpoints: "outliers",
        fillcolor: "rgba(148, 163, 184, 0.35)",
        line: { color: "#64748b", width: 1.5 },
        marker: {
          color: "#64748b",
          outliercolor: "#dc2626",
          size: 4,
        },
        hoveron: "points",
        hovertemplate: "k %{x:.4f}<extra>Outlier</extra>",
        showlegend: false,
        xaxis: "x",
        yaxis: "y",
      },
      {
        type: "scatter",
        mode: "markers",
        x: [k_today],
        y: [0],
        name: "k today",
        marker: {
          size: 14,
          color: "#0f172a",
          symbol: "diamond",
          line: { color: "#0f172a", width: 1.5 },
        },
        hovertemplate: "k today %{x:.4f}<extra></extra>",
        xaxis: "x",
        yaxis: "y",
      },
      {
        type: "bar",
        x: histogram.centers,
        y: histogram.counts,
        width: histogram.width * 0.92,
        marker: { color: "#94a3b8" },
        text: labelText,
        textposition: "outside",
        textfont: { size: 9, color: "#475569" },
        cliponaxis: false,
        hovertemplate: "k %{x:.4f}<br>count %{y}<extra></extra>",
        showlegend: false,
        xaxis: "x2",
        yaxis: "y2",
      },
    ];
  }, [histogram, k_today, k_values]);

  const layout = useMemo((): Partial<Layout> => {
    return {
      ...PLOTLY_PAN_ZOOM_LAYOUT,
      autosize: true,
      height: 420,
      margin: { l: 48, r: 16, t: 8, b: 52 },
      grid: { rows: 2, columns: 1, roworder: "top to bottom" },
      xaxis: {
        anchor: "y",
        showticklabels: false,
        zeroline: false,
      },
      yaxis: {
        anchor: "x",
        domain: [0.44, 1],
        showticklabels: false,
        zeroline: false,
      },
      xaxis2: {
        anchor: "y2",
        matches: "x",
        title: { text: "k = price / MA(H)" },
        zeroline: false,
      },
      yaxis2: {
        anchor: "x2",
        domain: [0, 0.38],
        title: { text: "Count" },
        rangemode: "tozero",
        range: maxCount > 0 ? [0, maxCount * 1.18] : [0, 1],
        zeroline: false,
      },
      shapes: [
        {
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: k_today - k_wiggle,
          x1: k_today + k_wiggle,
          y0: 0,
          y1: 1,
          fillcolor: "rgba(34, 197, 94, 0.15)",
          line: { width: 0 },
          layer: "below",
        },
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: k_today,
          x1: k_today,
          y0: 0,
          y1: 1,
          line: { color: "#0f172a", width: 1.5, dash: "dot" },
          layer: "above",
        },
      ],
      legend: { orientation: "h", y: 1.08 },
    };
  }, [k_today, k_wiggle, maxCount]);

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
        layout={layout}
        config={PLOTLY_PAN_ZOOM_CONFIG}
        useResizeHandler
        className="w-full"
      />
      <p className="mt-2 text-xs text-slate-500">
        Top: box + outliers (red, hover on outliers only). Dotted line = k today. Green band = ±k wiggle.
        Drag to pan, scroll to zoom, double-click to reset.
      </p>
    </section>
  );
}
