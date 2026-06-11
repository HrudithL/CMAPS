import Plot from "react-plotly.js";
import type { StrategyResult } from "../types/analysis";

interface Props {
  title: string;
  rows: StrategyResult[];
  onRowClick: (row: StrategyResult) => void;
}

function sideLabel(side: string) {
  return side === "long" ? "Long" : side === "short" ? "Short" : side;
}

function formatCp(row: StrategyResult) {
  const aSet = row.side === "long" ? "A_long" : "A_short";
  const bSet = row.side === "long" ? "B_long" : "B_short";
  return `${(row.cp * 100).toFixed(1)}% (|${aSet}|/|${bSet}| = ${row.hits}/${row.occurrences})`;
}

export function StrategyTable({ title, rows, onRowClick }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2">H</th>
              <th className="px-2 py-2">T</th>
              <th className="px-2 py-2">k</th>
              <th className="px-2 py-2">Relation</th>
              <th className="px-2 py-2">Hits</th>
              <th className="px-2 py-2">n</th>
              <th className="px-2 py-2">
                CP
                <span className="mt-0.5 block text-[10px] font-normal normal-case text-slate-400">
                  |A|/|B|
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.side}-${row.H}-${row.T}`}
                className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                onClick={() => onRowClick(row)}
              >
                <td className="px-2 py-2">
                  <span
                    className={
                      row.side === "long"
                        ? "font-medium text-emerald-700"
                        : "font-medium text-rose-700"
                    }
                  >
                    {sideLabel(row.side)}
                  </span>
                </td>
                <td className="px-2 py-2">{row.H}</td>
                <td className="px-2 py-2">{row.T}</td>
                <td className="px-2 py-2">{row.k_today.toFixed(4)}</td>
                <td className="px-2 py-2">{row.relation}</td>
                <td className="px-2 py-2">{row.hits}</td>
                <td className="px-2 py-2">{row.occurrences}</td>
                <td className="px-2 py-2 font-medium">{formatCp(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="mt-4">
          <Plot
            data={[
              {
                type: "bar",
                orientation: "h",
                y: rows
                  .map((r) => `${sideLabel(r.side)} · H=${r.H}, T=${r.T}`)
                  .reverse(),
                x: rows.map((r) => r.cp * 100).reverse(),
                marker: {
                  color: rows
                    .map((r) => (r.side === "long" ? "#2ca02c" : "#d62728"))
                    .reverse(),
                },
                text: rows.map((r) => `${(r.cp * 100).toFixed(1)}%`).reverse(),
                textposition: "outside",
              },
            ]}
            layout={{
              autosize: true,
              height: Math.max(220, rows.length * 36),
              margin: { l: 120, r: 40, t: 10, b: 40 },
              xaxis: { title: "CP (%)", range: [0, 100] },
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler
            className="w-full"
          />
        </div>
      )}
    </section>
  );
}
