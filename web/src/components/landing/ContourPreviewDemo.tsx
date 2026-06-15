/** Stylized contour heatmap preview. */
export function ContourPreviewDemo() {
  const cols = 12;
  const rows = 8;
  const cells: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const dist = Math.hypot(c - 5, r - 3.5);
      row.push(Math.max(0, 1 - dist / 5));
    }
    cells.push(row);
  }

  function cellColor(v: number) {
    if (v < 0.3) return `rgba(244, 63, 94, ${0.3 + v})`;
    if (v < 0.6) return `rgba(245, 158, 11, ${0.3 + v * 0.5})`;
    return `rgba(16, 185, 129, ${0.3 + v * 0.5})`;
  }

  return (
    <div className="flex h-full flex-col p-2">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-ash)]">
        CP across H × T
      </p>
      <div
        className="grid flex-1 gap-0.5 rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cells.flat().map((v, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: cellColor(v) }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[9px] text-[var(--color-ash)]">
        <span>low CP</span>
        <div className="flex h-1.5 w-24 overflow-hidden rounded-full">
          <div className="flex-1 bg-rose-500/60" />
          <div className="flex-1 bg-amber-500/60" />
          <div className="flex-1 bg-emerald-500/60" />
        </div>
        <span>high CP</span>
      </div>
    </div>
  );
}
