import { formatMaRelation, maRelationColumnHeader } from "../lib/maRelation";
import type { StrategyResult } from "../types/analysis";

interface Props {
  H: number;
  k: number;
  relation?: string;
  rows: StrategyResult[];
  onRowClick?: (row: StrategyResult) => void;
}

function rowClass(side: string) {
  if (side === "long") {
    return "border-l-4 border-l-[var(--color-emerald)] bg-[var(--color-emerald)]/10 hover:bg-[var(--color-emerald)]/15";
  }
  if (side === "short") {
    return "border-l-4 border-l-[var(--color-rose)] bg-[var(--color-rose)]/10 hover:bg-[var(--color-rose)]/15";
  }
  return "hover:bg-[var(--color-surface-muted)]";
}

function formatCp(cp: number, hits: number, occurrences: number) {
  return `${(cp * 100).toFixed(1)}% (${hits}/${occurrences})`;
}

export function StrategyTable({ H, k, relation, rows, onRowClick }: Props) {
  const clickable = Boolean(onRowClick);
  const withCp = rows.filter((row) => row.occurrences > 0);

  return (
    <section className="site-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-medium text-[var(--color-text-primary)]">
          Top Strategies at H = {H}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          k = {k.toFixed(4)}
          {relation ? ` (${formatMaRelation(relation, H)})` : ""}
        </p>
      </div>

      {withCp.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No strategies with CP at this H.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              <th className="px-2 py-2">T</th>
              <th className="px-2 py-2">{maRelationColumnHeader(H)}</th>
              <th className="px-2 py-2">CP</th>
              <th className="px-2 py-2">Smoothed CP</th>
            </tr>
          </thead>
          <tbody>
            {withCp.map((row) => (
              <tr
                key={`${row.side}-${row.H}-${row.T}`}
                className={[
                  "border-b border-[var(--color-border)]",
                  rowClass(row.side),
                  clickable ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
              >
                <td className="px-2 py-2 tabular-nums">{row.T}</td>
                <td className="px-2 py-2">{formatMaRelation(row.relation, H)}</td>
                <td className="px-2 py-2 tabular-nums text-[var(--color-text-primary)]">
                  {formatCp(row.cp, row.hits, row.occurrences)}
                </td>
                <td className="px-2 py-2 tabular-nums text-[var(--color-text-primary)]">
                  {row.smoothed_cp != null
                    ? `${(row.smoothed_cp * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
