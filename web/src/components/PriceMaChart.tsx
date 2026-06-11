import { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { AnalyzeResponse } from "../types/analysis";

const DEFAULT_MAS = [65, 200, 365];
const MAX_MAS = 3;
const MA_COLORS = ["#ff7f0e", "#9467bd", "#8c564b"];

interface Props {
  data: AnalyzeResponse;
  maOptions: number[];
}

export function PriceMaChart({ data, maOptions }: Props) {
  const { price_context: ctx } = data;
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
      if (prev.includes(h)) {
        return prev.filter((v) => v !== h);
      }
      if (prev.length >= MAX_MAS) return prev;
      return [...prev, h].sort((a, b) => a - b);
    });
  };

  const traces = useMemo(() => {
    const result: Data[] = [
      {
        x: ctx.series.map((p) => p.date),
        y: ctx.series.map((p) => p.price),
        type: "scatter",
        mode: "lines",
        name: "BTC price",
        line: { color: "#1f77b4", width: 1.5 },
      },
    ];

    selected.forEach((H, i) => {
      const key = `ma_${H}`;
      result.push({
        x: ctx.series.map((p) => p.date),
        y: ctx.series.map((p) => p[key] ?? null),
        type: "scatter",
        mode: "lines",
        name: `MA(${H})`,
        line: { dash: "dash", width: 1.2, color: MA_COLORS[i % MA_COLORS.length] },
      });
    });

    return result;
  }, [ctx.series, selected]);

  const atMax = selected.length >= MAX_MAS;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Bitcoin price &amp; moving averages</h2>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen((v) => !v)}
          >
            MAs ({selected.length}/{MAX_MAS}) ▾
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-md border border-slate-200 bg-white py-2 shadow-lg">
              {maOptions.map((h) => {
                const checked = selected.includes(h);
                const disabled = !checked && atMax;
                return (
                  <label
                    key={h}
                    className={[
                      "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                      disabled ? "cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-slate-50",
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
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 440,
          margin: { l: 70, r: 20, t: 10, b: 50 },
          shapes: [
            {
              type: "line",
              x0: ctx.analysis_date,
              x1: ctx.analysis_date,
              y0: 0,
              y1: 1,
              yref: "paper",
              line: { color: "#64748b", dash: "dot", width: 1 },
            },
          ],
          xaxis: { title: { text: "Date" } },
          yaxis: { title: { text: "USD" }, tickprefix: "$", type: "linear" },
          legend: { orientation: "h", y: 1.1 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        className="w-full"
        useResizeHandler
      />
    </section>
  );
}
