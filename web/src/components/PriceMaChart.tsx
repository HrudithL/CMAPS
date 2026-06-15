import { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import { PLOTLY_PAN_ZOOM_CONFIG, themedLayout } from "../lib/plotlyConfig";
import type { AnalyzeResponse } from "../types/analysis";

const DEFAULT_MAS = [65, 200, 365];
const MAX_MAS = 3;
const MA_COLORS = ["#f59e0b", "#6366f1", "#78716c"];

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
        x: ctx.dates,
        y: ctx.price,
        type: "scatter",
        mode: "lines",
        name: "BTC price",
        line: { color: "#1a1917", width: 2 },
      },
    ];

    selected.forEach((H, i) => {
      result.push({
        x: ctx.dates,
        y: ctx.ma[String(H)] ?? ctx.dates.map(() => null),
        type: "scatter",
        mode: "lines",
        name: `MA(${H})`,
        line: { dash: "dash", width: 1.2, color: MA_COLORS[i % MA_COLORS.length] },
      });
    });

    return result;
  }, [ctx.dates, ctx.price, ctx.ma, selected]);

  const atMax = selected.length >= MAX_MAS;

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-medium text-[var(--color-carbon)]">
          Bitcoin price &amp; moving averages
        </h2>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="app-btn-outline px-3 py-1.5 text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            MAs ({selected.length}/{MAX_MAS}) ▾
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-[var(--color-chalk)] bg-[var(--color-paper)] py-2 shadow-lg">
              {maOptions.map((h) => {
                const checked = selected.includes(h);
                const disabled = !checked && atMax;
                return (
                  <label
                    key={h}
                    className={[
                      "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                      disabled
                        ? "cursor-not-allowed text-[var(--color-slate-ui)]"
                        : "text-[var(--color-graphite)] hover:bg-[var(--color-fog)]",
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
        layout={themedLayout({
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
              line: { color: "#a8a29e", dash: "dot", width: 1 },
            },
          ],
          xaxis: { title: { text: "Date" } },
          yaxis: { title: { text: "USD" }, tickprefix: "$", type: "linear" },
          legend: { orientation: "h", y: 1.1 },
        })}
        config={PLOTLY_PAN_ZOOM_CONFIG}
        className="w-full"
        useResizeHandler
      />
    </section>
  );
}
