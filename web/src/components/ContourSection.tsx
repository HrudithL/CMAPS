import { useMemo, useState } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useTheme } from "../context/ThemeContext";
import { ChartFrame } from "./charts/ChartFrame";
import { buildNivoTheme, CP_SURFACE_SEQUENTIAL, NIVO_STATIC } from "../lib/nivoTheme";
import { downsampleContourGrid, downsampleIndices } from "../lib/chartUtils";
import type { ContourPayload } from "../types/analysis";

interface Props {
  contour: ContourPayload;
  selectedH: number;
  selectedT: number;
}

type SurfaceMode = "cp" | "smoothed_cp";

const HEATMAP_MARGIN = { top: 8, right: 108, bottom: 48, left: 56 };

function sparseHeatmapTicks(values: number[], maxTicks = 8): string[] {
  if (values.length === 0) return [];
  const indices = downsampleIndices(values.length, maxTicks);
  return indices.map((i) => String(values[i]));
}

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

export function ContourSection({ contour, selectedH, selectedT }: Props) {
  const [mode, setMode] = useState<SurfaceMode>("cp");
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const { smoothing } = contour;

  const snappedH = snapToGrid(selectedH, contour.H_values);
  const snappedT = snapToGrid(selectedT, contour.T_values);
  const zMatrix = mode === "cp" ? contour.cp : contour.smoothed_cp;
  const modeLabel = mode === "cp" ? "CP" : "Smoothed CP";

  const grid = useMemo(
    () => downsampleContourGrid(contour.H_values, contour.T_values, zMatrix),
    [contour.H_values, contour.T_values, zMatrix],
  );

  const data = useMemo(
    () =>
      grid.H_values.map((h, hi) => ({
        id: String(h),
        data: grid.T_values.map((t, ti) => ({
          x: String(t),
          y: grid.matrix[hi]?.[ti] ?? null,
        })),
      })),
    [grid],
  );

  const highlightValue = useMemo(() => {
    const hi = grid.H_values.indexOf(snappedH);
    const ti = grid.T_values.indexOf(snappedT);
    if (hi >= 0 && ti >= 0) return grid.matrix[hi]?.[ti] ?? null;
    const fullHi = contour.H_values.indexOf(snappedH);
    const fullTi = contour.T_values.indexOf(snappedT);
    return fullHi >= 0 && fullTi >= 0 ? zMatrix[fullHi]?.[fullTi] : null;
  }, [contour.H_values, contour.T_values, grid, snappedH, snappedT, zMatrix]);

  const hAxisTicks = useMemo(() => sparseHeatmapTicks(grid.H_values, 8), [grid.H_values]);
  const tAxisTicks = useMemo(() => sparseHeatmapTicks(grid.T_values, 8), [grid.T_values]);

  return (
    <section className="site-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium text-[var(--color-text-primary)]">
            Strategy surface
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-[var(--color-text-muted)]">
            Orange = low {modeLabel}, blue = high. Selected H={snappedH}, T={snappedT}
            {highlightValue != null && ` (${(highlightValue * 100).toFixed(1)}%)`}.
            {grid.downsampled
              ? ` Grid decimated to ${grid.H_values.length}×${grid.T_values.length} for display (${contour.H_values.length}×${contour.T_values.length} computed).`
              : null}
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
          Surface
          <select
            className="site-input px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as SurfaceMode)}
          >
            <option value="cp">Conditional probability</option>
            <option value="smoothed_cp">Smoothed CP</option>
          </select>
        </label>
      </div>

      <ChartFrame height={500}>
        <ResponsiveHeatMap
          key={`${theme}-${mode}`}
          data={data}
          theme={nivoTheme}
          {...NIVO_STATIC}
          margin={HEATMAP_MARGIN}
          valueFormat=">-.0%"
          enableLabels={false}
          isInteractive={false}
          axisTop={null}
          axisRight={null}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            legend: "H (days)",
            legendPosition: "middle",
            legendOffset: -48,
            format: (v) => String(v),
            tickValues: hAxisTicks,
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            legend: "T (days)",
            legendPosition: "middle",
            legendOffset: 36,
            format: (v) => String(v),
            tickValues: tAxisTicks,
          }}
          colors={CP_SURFACE_SEQUENTIAL}
          emptyColor="var(--color-border)"
          borderWidth={1}
          borderColor="var(--color-card-inner)"
          borderRadius={2}
          opacity={1}
          legends={[
            {
              anchor: "right",
              translateX: 52,
              translateY: 0,
              length: 140,
              thickness: 10,
              direction: "column",
              tickPosition: "after",
              tickSize: 2,
              tickSpacing: 4,
              tickFormat: ">-.0%",
            },
          ]}
        />
      </ChartFrame>

      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Smoothing: m = {smoothing.m} (default {smoothing.m_default}), r ={" "}
        {(smoothing.r * 100).toFixed(1)}% (default {(smoothing.r_default * 100).toFixed(1)}%).
      </p>
    </section>
  );
}
