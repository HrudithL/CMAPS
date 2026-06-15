import {
  atMaExplanation,
  buildTimeframeOutlooks,
  maHeading,
  outlookSectionHeading,
  similarDaysIntro,
  todayRelationSentence,
} from "../lib/overviewCopy";
import type { LandingHBlock } from "../types/landing";

interface Props {
  block: LandingHBlock;
  kWiggle: number;
  priceToday: number;
  resolvedDate: string;
  analysisDate: string;
}

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function summaryCardClass(relation: string) {
  const base =
    "flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm";
  if (relation === "below") {
    return `${base} border-emerald-200`;
  }
  if (relation === "above") {
    return `${base} border-rose-200`;
  }
  return `${base} border-slate-200`;
}

function OutlookBar({ cp, side }: { cp: number; side: "long" | "short" }) {
  if (cp <= 0) return null;
  const color = side === "long" ? "bg-emerald-500" : "bg-rose-500";
  return (
    <div
      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      aria-hidden
    >
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(cp * 100, 100)}%` }}
      />
    </div>
  );
}

export function OverviewNarrative({
  block,
  kWiggle,
  priceToday,
  resolvedDate,
  analysisDate,
}: Props) {
  const outlooks = buildTimeframeOutlooks(block, block.by_T);
  const isExactMa = block.relation === "at";
  const relationSentence = todayRelationSentence(
    block.relation,
    block.H,
    block.ma,
    formatPrice,
  );
  const outlookTone = block.relation === "below" ? "long" : "short";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={summaryCardClass("neutral")}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Current price
          </p>
          <p className="mt-1 text-xs text-slate-500">{resolvedDate}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 lg:text-3xl">
            {formatPrice(priceToday)}
          </p>
          {resolvedDate !== analysisDate && (
            <p className="mt-2 text-xs text-amber-700">
              Requested {analysisDate}; nearest trading day used
            </p>
          )}
        </section>

        <section className={summaryCardClass(block.relation)}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Versus {block.H}-day average
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {maHeading(block.relation, block.H)}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">
            {isExactMa
              ? atMaExplanation(block.H, formatPrice, block.ma)
              : relationSentence}
          </p>
        </section>

        <section className={summaryCardClass("neutral")}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Similar past days
          </p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">
            {similarDaysIntro(kWiggle, block.H, block.relation)}
          </p>
        </section>
      </div>

      {!isExactMa && outlooks.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">
            {outlookSectionHeading(block.relation)}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Bitcoin is{" "}
            {block.relation === "below" ? "below" : "above"} its {block.H}-day moving
            average today. Each card shows how often price moved in the typical direction
            after waiting that many days.
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {outlooks.map((outlook) => (
              <li
                key={outlook.T}
                className={[
                  "rounded-lg border px-4 py-4",
                  outlook.side === "long"
                    ? "border-emerald-100 bg-emerald-50/40"
                    : "border-rose-100 bg-rose-50/40",
                ].join(" ")}
              >
                <h4 className="text-sm font-semibold text-slate-900">
                  After {outlook.T} days
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {outlook.text}
                </p>
                {outlook.smoothedText && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {outlook.smoothedText}
                  </p>
                )}
                {outlook.stats.occurrences > 0 && (
                  <OutlookBar cp={outlook.stats.cp} side={outlookTone} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-slate-500">
        These figures describe past patterns only. They are not a forecast and not financial
        advice.
      </p>
    </div>
  );
}
