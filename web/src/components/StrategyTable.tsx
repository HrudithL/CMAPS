import { CpFormula } from "./CpFormula";
import { MathInline } from "./MathInline";
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
    return "border-l-4 border-l-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70";
  }
  if (side === "short") {
    return "border-l-4 border-l-rose-500 bg-rose-50/40 hover:bg-rose-50/70";
  }
  return "hover:bg-[var(--color-fog)]";
}

export function StrategyTable({ H, k, relation, rows, onRowClick }: Props) {
  const clickable = Boolean(onRowClick);
  const withCp = rows.filter((row) => row.occurrences > 0);

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-medium text-[var(--color-carbon)]">
          Top Strategies at H = {H}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-graphite)]">
          k = {k.toFixed(4)}
          {relation ? ` (${formatMaRelation(relation, H)})` : ""}
        </p>
      </div>

      {withCp.length === 0 ? (
        <p className="text-sm text-[var(--color-slate-ui)]">No strategies with CP at this H.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-chalk)] text-left font-mono text-[10px] uppercase tracking-wider text-[var(--color-slate-ui)]">
              <th className="px-2 py-2">T</th>
              <th className="px-2 py-2">{maRelationColumnHeader(H)}</th>
              <th className="px-2 py-2">
                <MathInline>{String.raw`CP=\frac{|A|}{|B|}`}</MathInline>
              </th>
              <th className="px-2 py-2">
                <MathInline>{String.raw`CP_{\text{smooth}}`}</MathInline>
              </th>
            </tr>
          </thead>
          <tbody>
            {withCp.map((row) => (
              <tr
                key={`${row.side}-${row.H}-${row.T}`}
                className={[
                  "border-b border-[var(--color-chalk)]",
                  rowClass(row.side),
                  clickable ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
              >
                <td className="px-2 py-2 tabular-nums">{row.T}</td>
                <td className="px-2 py-2">{formatMaRelation(row.relation, H)}</td>
                <td className="px-2 py-2">
                  <CpFormula
                    side={row.side as "long" | "short"}
                    cp={row.cp}
                    hits={row.hits}
                    occurrences={row.occurrences}
                  />
                </td>
                <td className="px-2 py-2 tabular-nums text-[var(--color-carbon)]">
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
