export const INTERACTIVE_LINE_MARGINS = {
  top: 20,
  right: 28,
  bottom: 52,
  left: 80,
} as const;

export function formatDateLabel(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatHistoryAxisDate(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "2-digit", month: "short" });
}

export function sparseDateTicks(dates: string[], maxTicks: number) {
  if (dates.length <= maxTicks) return dates;
  const step = Math.ceil(dates.length / maxTicks);
  const ticks: string[] = [];
  for (let i = 0; i < dates.length; i += step) ticks.push(dates[i]);
  const last = dates[dates.length - 1];
  if (ticks[ticks.length - 1] !== last) ticks.push(last);
  return ticks;
}

export function linePointTooltip({
  point,
}: {
  point: { data: { x: unknown; y: unknown }; seriesId: string | number };
}) {
  return (
    <div className="font-mono text-[11px] leading-relaxed">
      <strong>{formatDateLabel(String(point.data.x))}</strong>
      <br />
      {point.seriesId}: ${Number(point.data.y).toLocaleString()}
    </div>
  );
}
