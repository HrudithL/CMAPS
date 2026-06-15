import { useMemo } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { buildNivoTheme, CP_SURFACE_SEQUENTIAL, NIVO_STATIC } from "../../lib/nivoTheme";
import { useTheme } from "../../context/ThemeContext";
import type { ContourSnippet } from "../../types/landing";

interface Props {
  snippet: ContourSnippet;
}

export function ContourPreviewDemo({ snippet }: Props) {
  const { theme } = useTheme();
  const nivoTheme = useMemo(() => buildNivoTheme(theme), [theme]);
  const { H_values, T_values, cp } = snippet;

  const data = useMemo(
    () =>
      H_values.map((h, hi) => ({
        id: String(h),
        data: T_values.map((t, ti) => ({
          x: String(t),
          y: cp[hi]?.[ti] ?? null,
        })),
      })),
    [H_values, T_values, cp],
  );

  return (
    <div className="flex h-full flex-col p-1">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        CP surface · H × T
      </p>
      <div className="min-h-0 flex-1">
        <ResponsiveHeatMap
          key={theme}
          data={data}
          theme={nivoTheme}
          {...NIVO_STATIC}
          margin={{ top: 4, right: 4, bottom: 28, left: 36 }}
          valueFormat=">-.0%"
          enableLabels={false}
          isInteractive={false}
          axisTop={null}
          axisRight={null}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            format: (v) => `H${v}`,
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            format: (v) => `T${v}`,
          }}
          colors={CP_SURFACE_SEQUENTIAL}
          emptyColor="var(--color-border)"
          borderWidth={2}
          borderColor="var(--color-card-inner)"
          opacity={1}
          borderRadius={3}
        />
      </div>
    </div>
  );
}
