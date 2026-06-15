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
  const base = "site-card flex h-full flex-col p-5";
  if (relation === "below") {
    return `${base} ring-1 ring-[var(--color-emerald)]/30`;
  }
  if (relation === "above") {
    return `${base} ring-1 ring-[var(--color-rose)]/30`;
  }
  return base;
}

function OutlookBar({ cp, side }: { cp: number; side: "long" | "short" }) {
  if (cp <= 0) return null;
  const color =
    side === "long" ? "bg-[var(--color-emerald)]" : "bg-[var(--color-rose)]";
  return (
    <div
      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={summaryCardClass("neutral")}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Current price
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{resolvedDate}</p>
          <p className="font-display mt-3 text-3xl font-medium tabular-nums text-[var(--color-text-primary)] lg:text-4xl">
            {formatPrice(priceToday)}
          </p>
          {resolvedDate !== analysisDate && (
            <p className="mt-2 text-xs text-[var(--color-amber)]">
              Requested {analysisDate}; nearest trading day used
            </p>
          )}
        </section>

        <section className={summaryCardClass(block.relation)}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Versus {block.H}-day average
          </p>
          <h3 className="font-display mt-3 text-lg font-medium text-[var(--color-text-primary)]">
            {maHeading(block.relation, block.H)}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {isExactMa
              ? atMaExplanation(block.H, formatPrice, block.ma)
              : relationSentence}
          </p>
        </section>

        <section className={summaryCardClass("neutral")}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Similar past days
          </p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {similarDaysIntro(kWiggle, block.H, block.relation)}
          </p>
        </section>
      </div>

      {!isExactMa && outlooks.length > 0 && (
        <section className="site-card p-6 sm:p-8">
          <h3 className="font-display text-xl font-medium text-[var(--color-text-primary)]">
            {outlookSectionHeading(block.relation)}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Bitcoin is{" "}
            {block.relation === "below" ? "below" : "above"} its {block.H}-day moving
            average today. Each card shows how often price moved in the typical direction
            after waiting that many days.
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {outlooks.map((outlook) => (
              <li
                key={outlook.T}
                className={[
                  "rounded-xl border px-5 py-5",
                  outlook.side === "long"
                    ? "border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/10"
                    : "border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10",
                ].join(" ")}
              >
                <h4 className="font-display text-base font-medium text-[var(--color-text-primary)]">
                  After {outlook.T} days
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-primary)]">
                  {outlook.text}
                </p>
                {outlook.smoothedText && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        These figures describe past patterns only. They are not a forecast and not financial
        advice.
      </p>
    </div>
  );
}
