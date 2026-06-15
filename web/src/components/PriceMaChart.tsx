import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "../context/ThemeContext";
import { ChartFrame } from "./charts/ChartFrame";
import { buildNivoTheme, CHART_PALETTE, NIVO_STATIC } from "../lib/nivoTheme";
import { dateHighlightLayer, lineLayersWithHighlight } from "../lib/nivoLayers";
import {
  formatHistoryAxisDate,
  INTERACTIVE_LINE_MARGINS,
  linePointTooltip,
  sparseDateTicks,
} from "../lib/lineChartShared";
import type { AnalyzeResponse } from "../types/analysis";

const DEFAULT_MAS = [65, 200, 365];
const MAX_MAS = 3;

interface Props {
  data: AnalyzeResponse;
  maOptions: number[];
}

export function PriceMaChart({ data, maOptions }: Props) {
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const ctx = data.price_context;

  const [selected, setSelected] = useState<number[]>(() =>
    DEFAULT_MAS.filter((h) => maOptions.includes(h)),
  );
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected((prev) => {
      const valid = prev.filter((h) => maOptions.includes(h));
      if (valid.length > 0) return valid;
      const defaults = DEFAULT_MAS.filter((h) => maOptions.includes(h));
      if (defaults.length > 0) return defaults.slice(0, MAX_MAS);
      return maOptions.slice(0, Math.min(MAX_MAS, maOptions.length));
    });
  }, [maOptions]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleMa = (h: number) => {
    setSelected((prev) => {
      if (prev.includes(h)) return prev.filter((v) => v !== h);
      if (prev.length >= MAX_MAS) return prev;
      return [...prev, h].sort((a, b) => a - b);
    });
  };

  const lineData = useMemo(() => {
    const series: {
      id: string;
      color: string;
      data: { x: string; y: number | null }[];
    }[] = [
      {
        id: "BTC",
        color: CHART_PALETTE.pricePlot,
        data: ctx.dates.map((date, i) => ({ x: date, y: ctx.price[i] ?? null })),
      },
    ];
    selected.forEach((H, i) => {
      series.push({
        id: `MA(${H})`,
        color: CHART_PALETTE.ma[i % CHART_PALETTE.ma.length],
        data: ctx.dates.map((date, idx) => ({
          x: date,
          y: ctx.ma[String(H)]?.[idx] ?? null,
        })),
      });
    });
    return series;
  }, [ctx.dates, ctx.ma, ctx.price, selected]);

  const atMax = selected.length >= MAX_MAS;
  const analysisIdx = ctx.dates.indexOf(ctx.analysis_date);
  const historyStart = ctx.dates[0] ?? "";
  const historyEnd = ctx.dates[ctx.dates.length - 1] ?? "";

  const highlightLayer = useMemo(
    () =>
      dateHighlightLayer({
        serieId: "BTC",
        highlightDates: [],
        emphasisDate: ctx.analysis_date,
      }),
    [ctx.analysis_date],
  );

  const xTickValues = useMemo(
    () => sparseDateTicks(ctx.dates, 8),
    [ctx.dates],
  );

  return (
    <section className="site-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-medium text-[var(--color-text-primary)]">
            Bitcoin price &amp; moving averages
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Full history · {ctx.dates.length.toLocaleString()} trading days
            {historyStart && historyEnd ? ` · ${historyStart} → ${historyEnd}` : ""}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="site-btn-outline px-3 py-1.5 text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            MAs ({selected.length}/{MAX_MAS}) ▾
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] py-2 shadow-lg">
              {maOptions.map((h) => {
                const checked = selected.includes(h);
                const disabled = !checked && atMax;
                return (
                  <label
                    key={h}
                    className={[
                      "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                      disabled
                        ? "cursor-not-allowed text-[var(--color-text-muted)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleMa(h)}
                    />
                    MA({h})
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChartFrame className="chart-frame-interactive" height={460}>
        <ResponsiveLine
          key={`${theme}-${selected.join("-")}`}
          data={lineData}
          theme={nivoTheme}
          {...NIVO_STATIC}
          margin={INTERACTIVE_LINE_MARGINS}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            format: (v) => formatHistoryAxisDate(String(v)),
            tickValues: xTickValues,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
            format: (v) => `$${Number(v).toLocaleString()}`,
          }}
          enableGridX={false}
          colors={(serie) => String(serie.color)}
          enableArea={false}
          enablePoints={false}
          layers={
            lineLayersWithHighlight(highlightLayer, {
              dashedMa: true,
              priceStrokeWidth: 1.5,
            }) as never
          }
          curve="monotoneX"
          useMesh
          enableSlices="x"
          tooltip={linePointTooltip}
          markers={
            analysisIdx >= 0
              ? [
                  {
                    axis: "x",
                    value: ctx.analysis_date,
                    lineStyle: {
                      stroke: CHART_PALETTE.pricePlot,
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                      strokeOpacity: 0.5,
                    },
                  },
                ]
              : []
          }
          legends={[
            {
              anchor: "top-right",
              direction: "row",
              translateY: -8,
              itemWidth: 72,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: "circle",
            },
          ]}
        />
      </ChartFrame>
    </section>
  );
}
