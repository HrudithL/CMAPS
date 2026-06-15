import { useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { buildNivoTheme, CHART_PALETTE, NIVO_STATIC } from "../../lib/nivoTheme";
import { dateHighlightLayer, lineLayersWithHighlight } from "../../lib/nivoLayers";
import {
  INTERACTIVE_LINE_MARGINS,
  linePointTooltip,
  sparseDateTicks,
  formatDateLabel,
} from "../../lib/lineChartShared";
import { useTheme } from "../../context/ThemeContext";
import { ChartFrame } from "../charts/ChartFrame";
import type { LandingPreviewResponse } from "../../types/landing";

interface Props {
  preview: LandingPreviewResponse;
}

export function AnalogMatchDemo({ preview }: Props) {
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const { price_preview: ctx, chart_H, analog_dates, resolved_date } = preview;

  const data = useMemo(() => {
    const price = {
      id: "BTC",
      color: CHART_PALETTE.price,
      data: ctx.dates.map((date, i) => ({
        x: date,
        y: ctx.price[i] ?? null,
      })),
    };
    const ma = {
      id: `MA(${chart_H})`,
      color: CHART_PALETTE.ma[1],
      data: ctx.dates.map((date, i) => ({
        x: date,
        y: ctx.ma[i] ?? null,
      })),
    };
    return [price, ma];
  }, [chart_H, ctx.dates, ctx.ma, ctx.price]);

  const highlightLayer = useMemo(
    () =>
      dateHighlightLayer({
        serieId: "BTC",
        highlightDates: analog_dates,
        emphasisDate: resolved_date,
      }),
    [analog_dates, resolved_date],
  );

  const xTickValues = useMemo(
    () => sparseDateTicks(ctx.dates, 5),
    [ctx.dates],
  );

  return (
    <ChartFrame className="chart-frame-interactive h-full min-h-[200px]">
      <ResponsiveLine
        key={theme}
        data={data}
        theme={nivoTheme}
        {...NIVO_STATIC}
        margin={{ ...INTERACTIVE_LINE_MARGINS, bottom: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          format: (v) => formatDateLabel(String(v)),
          tickValues: xTickValues,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          format: (v) => `$${Math.round(Number(v) / 1000)}k`,
        }}
        enableGridX={false}
        enableGridY
        gridYValues={4}
        colors={(serie) => String(serie.color)}
        enableArea={false}
        enablePoints={false}
        layers={lineLayersWithHighlight(highlightLayer, { dashedMa: true }) as never}
        useMesh
        enableSlices="x"
        curve="monotoneX"
        legends={[]}
        tooltip={linePointTooltip}
      />
    </ChartFrame>
  );
}
