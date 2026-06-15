import { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { buildNivoTheme, CHART_PALETTE, NIVO_MOTION } from "../../lib/nivoTheme";
import { useTheme } from "../../context/ThemeContext";
import { ChartFrame } from "../charts/ChartFrame";
import type { LandingMaBar } from "../../types/landing";

interface Props {
  bars: LandingMaBar[];
  defaultT: number;
  relation: string;
}

const BAR_COLORS = [CHART_PALETTE.price, CHART_PALETTE.ma[1], CHART_PALETTE.ma[2]];

function relationLabel(relation: string) {
  if (relation === "below") return "below MA";
  if (relation === "above") return "above MA";
  return "at MA";
}

export function ProbabilityDemo({ bars, defaultT, relation }: Props) {
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const sorted = [...bars].sort((a, b) => a.H - b.H);

  const chartData = useMemo(
    () =>
      sorted.map((bar, i) => ({
        id: `${bar.H}d`,
        ma: `${bar.H}-day`,
        smooth: Math.round(bar.smoothed_cp * 100),
        raw: Math.round(bar.cp * 100),
        hits: bar.hits,
        occ: bar.occurrences,
        color: BAR_COLORS[i % BAR_COLORS.length],
      })),
    [sorted],
  );

  const gradientDefs = useMemo(
    () =>
      chartData.map((row) => ({
        id: `grad-${row.id}`,
        type: "linearGradient" as const,
        colors: [
          { offset: 0, color: row.color, opacity: 1 },
          { offset: 100, color: row.color, opacity: 0.45 },
        ],
      })),
    [chartData],
  );

  const gradientFills = useMemo(
    () => chartData.map((row) => ({ match: { id: row.id }, id: `grad-${row.id}` })),
    [chartData],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-1">
      <p className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        CP after similar {relationLabel(relation)} · T={defaultT}d
      </p>
      <ChartFrame className="chart-frame-interactive min-h-0 flex-1">
        <ResponsiveBar
          key={theme}
          data={chartData}
          theme={nivoTheme}
          {...NIVO_MOTION}
          keys={["smooth"]}
          indexBy="id"
          margin={{ top: 14, right: 12, bottom: 8, left: 12 }}
          padding={0.32}
          innerPadding={4}
          borderRadius={5}
          defs={gradientDefs}
          fill={gradientFills}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["brighter", 0.35]] }}
          enableGridY={false}
          enableLabel
          label={(d) => `${d.value}%`}
          labelSkipHeight={10}
          labelTextColor="#f7f8f8"
          axisBottom={null}
          axisLeft={null}
          role="img"
          ariaLabel="Smoothed conditional probability by moving-average window"
          tooltip={({ data }) => (
            <div className="font-mono text-[11px] leading-relaxed">
              <strong>{data.ma} MA</strong>
              <br />
              Smooth {data.smooth}% · Raw {data.raw}%
              <br />
              {data.hits}/{data.occ} analogs
            </div>
          )}
        />
      </ChartFrame>
    </div>
  );
}
