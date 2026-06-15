import { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "../context/ThemeContext";
import { ChartFrame } from "./charts/ChartFrame";
import { buildNivoTheme, CHART_PALETTE, NIVO_MOTION, NIVO_STATIC } from "../lib/nivoTheme";
import type { KDistributionPayload } from "../types/analysis";

interface Props {
  distribution: KDistributionPayload;
}

const HIST_BINS = 20;

type HistRow = {
  id: string;
  count: number;
  center: number;
  binStart: number;
  binEnd: number;
};

function buildHistogram(kValues: number[], bins: number) {
  if (kValues.length === 0) {
    return { rows: [] as HistRow[], min: 0, max: 1, width: 1 };
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
  const rows = counts.map((count, i) => {
    const binStart = min + i * width;
    const binEnd = i === bins - 1 ? max : min + (i + 1) * width;
    const center = min + (i + 0.5) * width;
    return {
      id: center.toFixed(4),
      count,
      center,
      binStart,
      binEnd,
    };
  });
  return { rows, min, max, width };
}

function binContaining(
  k: number,
  rows: HistRow[],
  min: number,
  width: number,
): HistRow | null {
  if (rows.length === 0) return null;
  let idx = Math.floor((k - min) / width);
  if (idx >= rows.length) idx = rows.length - 1;
  if (idx < 0) idx = 0;
  return rows[idx] ?? null;
}

function inWiggleBand(center: number, kToday: number, wiggle: number) {
  return Math.abs(center - kToday) <= wiggle * 1.05;
}

function formatK(value: number) {
  return value.toFixed(4);
}

export function KDistributionChart({ distribution }: Props) {
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const { k_values, k_today, k_wiggle, H, within_wiggle, total_history } = distribution;

  const histogram = useMemo(() => buildHistogram(k_values, HIST_BINS), [k_values]);

  const rowById = useMemo(
    () => new Map(histogram.rows.map((r) => [r.id, r])),
    [histogram.rows],
  );

  const markerBins = useMemo(() => {
    const { rows, min, width } = histogram;
    const rowFor = (k: number) => binContaining(k, rows, min, width);
    return {
      today: rowFor(k_today)?.id ?? null,
      low: rowFor(k_today - k_wiggle)?.id ?? null,
      high: rowFor(k_today + k_wiggle)?.id ?? null,
    };
  }, [histogram, k_today, k_wiggle]);

  const barMarkers = useMemo(() => {
    const markers = [];
    if (markerBins.today) {
      markers.push({
        axis: "x" as const,
        value: markerBins.today,
        lineStyle: {
          stroke: CHART_PALETTE.price,
          strokeWidth: 2,
          strokeDasharray: "4 4",
        },
      });
    }
    if (markerBins.low) {
      markers.push({
        axis: "x" as const,
        value: markerBins.low,
        lineStyle: { stroke: CHART_PALETTE.price, strokeWidth: 1, strokeOpacity: 0.35 },
      });
    }
    if (markerBins.high) {
      markers.push({
        axis: "x" as const,
        value: markerBins.high,
        lineStyle: { stroke: CHART_PALETTE.price, strokeWidth: 1, strokeOpacity: 0.35 },
      });
    }
    return markers;
  }, [markerBins]);

  const centerFor = (indexValue: string | number) =>
    rowById.get(String(indexValue))?.center ?? Number(indexValue);

  return (
    <section className="site-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-medium text-[var(--color-text-primary)]">
        Today&apos;s k vs historical k (H = {H})
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {within_wiggle.toLocaleString()} of {total_history.toLocaleString()} prior days within k ±{" "}
        {k_wiggle} of today ({k_today.toFixed(4)}).
      </p>

      <ChartFrame className="chart-frame-interactive mt-3" height={400}>
        <ResponsiveBar
          key={theme}
          data={histogram.rows}
          theme={nivoTheme}
          {...NIVO_STATIC}
          {...NIVO_MOTION}
          keys={["count"]}
          indexBy="id"
          margin={{ top: 16, right: 20, bottom: 52, left: 52 }}
          padding={0.22}
          borderRadius={4}
          colors={(bar) =>
            inWiggleBand(centerFor(bar.indexValue), k_today, k_wiggle)
              ? CHART_PALETTE.price
              : "rgba(99, 102, 241, 0.55)"
          }
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.25]] }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            legend: "k = price / MA(H)",
            legendPosition: "middle",
            legendOffset: 40,
            format: (v) => Number(v).toFixed(3),
            tickValues: histogram.rows
              .filter((_, i) => i % Math.ceil(histogram.rows.length / 6) === 0)
              .map((r) => r.id),
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            legend: "Count",
            legendPosition: "middle",
            legendOffset: -44,
          }}
          enableLabel={false}
          markers={barMarkers}
          tooltip={({ indexValue, value }) => {
            const row = rowById.get(String(indexValue));
            const inBand = row
              ? inWiggleBand(row.center, k_today, k_wiggle)
              : inWiggleBand(centerFor(indexValue), k_today, k_wiggle);
            return (
              <div className="font-mono text-[11px] leading-relaxed">
                <strong>
                  k {formatK(row?.binStart ?? Number(indexValue))} –{" "}
                  {formatK(row?.binEnd ?? Number(indexValue))}
                </strong>
                <br />
                count {value}
                {inBand ? (
                  <>
                    <br />
                    <span className="text-[var(--color-amber-glow)]">inside ±ε band</span>
                  </>
                ) : null}
              </div>
            );
          }}
        />
      </ChartFrame>

      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Amber bars = inside today&apos;s wiggle band · indigo = outside · dashed lines = ±ε · solid =
        k today.
      </p>
    </section>
  );
}
