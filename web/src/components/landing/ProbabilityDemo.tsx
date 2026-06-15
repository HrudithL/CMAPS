const BARS = [
  { label: "90d", pct: 62, count: "41 of 66" },
  { label: "180d", pct: 58, count: "38 of 65" },
  { label: "365d", pct: 71, count: "46 of 65" },
];

export function ProbabilityDemo() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-ash)]">
        After similar below-MA days
      </p>
      {BARS.map((bar) => (
        <div key={bar.label}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-xs text-[var(--color-mist)]">{bar.label}</span>
            <span className="font-display text-lg font-medium text-[var(--color-snow)]">
              {bar.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-rim)]">
            <div
              className="h-full rounded-full bg-[var(--color-amber)] transition-all duration-700"
              style={{ width: `${bar.pct}%` }}
            />
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--color-ash)]">{bar.count}</p>
        </div>
      ))}
    </div>
  );
}
