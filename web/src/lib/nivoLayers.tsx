import type { ReactElement } from "react";
import { CHART_PALETTE } from "./nivoTheme";

export type LineLayerProps = {
  series: {
    id: string;
    color: string;
    data: { data: { x: string | number; y: number | null } }[];
  }[];
  lineGenerator: (points: { x: number; y: number }[]) => string | null;
  xScale: (v: string | number) => number | null;
  yScale: (v: number) => number | null;
};

/** BTC solid, MA dashed — replaces default lines + area fill. */
export function styledPriceMaLinesLayer(
  props: LineLayerProps,
  options?: { priceStrokeWidth?: number },
): ReactElement {
  const priceWidth = options?.priceStrokeWidth ?? 2.5;
  const { series, lineGenerator, xScale, yScale } = props;
  return (
    <g className="price-ma-lines">
      {series.map((serie) => {
        const points = serie.data
          .filter((p) => p.data.y != null)
          .map((p) => ({
            x: xScale(p.data.x) ?? 0,
            y: yScale(p.data.y as number) ?? 0,
          }));
        const d = lineGenerator(points);
        if (!d) return null;
        const isMa = serie.id.startsWith("MA(");
        return (
          <path
            key={serie.id}
            d={d}
            fill="none"
            stroke={serie.color}
            strokeWidth={isMa ? 1.6 : priceWidth}
            strokeDasharray={isMa ? "6 4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

/** Nivo 0.99 pointColor/pointSize callbacks lack datum — draw highlights in a custom layer. */
export function dateHighlightLayer(options: {
  serieId: string;
  highlightDates: Iterable<string>;
  emphasisDate?: string;
}): (props: LineLayerProps) => ReactElement | null {
  const highlights = new Set(options.highlightDates);

  return ({ series, xScale, yScale }) => {
    const serie = series.find((s) => s.id === options.serieId);
    if (!serie) return null;

    return (
      <g className="date-highlights">
        {serie.data.map((point) => {
          const date = String(point.data.x);
          const isEmphasis = options.emphasisDate != null && date === options.emphasisDate;
          const isHighlight = highlights.has(date) || isEmphasis;
          if (!isHighlight || point.data.y == null) return null;

          const cx = xScale(point.data.x);
          const cy = yScale(point.data.y);
          if (cx == null || cy == null || Number.isNaN(cy)) return null;

          const r = isEmphasis ? 5.5 : 3.5;
          return (
            <circle
              key={date}
              cx={cx}
              cy={cy}
              r={r}
              fill={isEmphasis ? CHART_PALETTE.today : CHART_PALETTE.ring}
              stroke={isEmphasis ? CHART_PALETTE.price : "#fff"}
              strokeWidth={2}
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </g>
    );
  };
}

export function lineLayersWithHighlight(
  highlightLayer: (props: LineLayerProps) => ReactElement | null,
  options?: { dashedMa?: boolean; priceStrokeWidth?: number },
) {
  const linesLayer = (props: LineLayerProps) =>
    styledPriceMaLinesLayer(props, { priceStrokeWidth: options?.priceStrokeWidth });
  const base = ["grid", "markers", "axes"] as const;
  if (options?.dashedMa) {
    return [
      ...base,
      linesLayer,
      "crosshair",
      highlightLayer,
      "slices",
      "mesh",
      "legends",
    ] as const;
  }
  return [
    ...base,
    "areas",
    "crosshair",
    "lines",
    highlightLayer,
    "slices",
    "mesh",
    "legends",
  ] as const;
}
