import type { LandingPreviewResponse } from "../../types/landing";

interface Props {
  preview: LandingPreviewResponse;
}

function directionWord(relation: string, side: string) {
  if (relation === "below" || side === "long") return "rose";
  if (relation === "above" || side === "short") return "fell";
  return "moved";
}

export function HeroCpBlurb({ preview }: Props) {
  const { primary, chart_H, default_T, relation, ma_bars } = preview;
  const bar200 = ma_bars.find((b) => b.H === chart_H) ?? ma_bars[0];
  const rawPct = Math.round(primary.cp * 100);
  const smoothPct = Math.round(primary.smoothed_cp * 100);
  const verb = directionWord(relation, bar200?.side ?? "long");

  return (
    <div className="chart-blurb mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card-inner)]/80 p-4 backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-amber)]">
        What is CP here?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <strong className="font-medium text-[var(--color-text-primary)]">
          Conditional probability (CP)
        </strong>{" "}
        is the share of past days — with a similar price-to-moving-average setup as today — where
        Bitcoin {verb} within{" "}
        <span className="font-mono text-[var(--color-amber-glow)]">{default_T} days</span>.
        At H={chart_H},{" "}
        <span className="font-mono text-[var(--color-text-primary)]">
          {primary.hits} of {primary.occurrences}
        </span>{" "}
        analog days qualify, giving a raw CP of{" "}
        <span className="font-mono font-medium text-[var(--color-text-primary)]">{rawPct}%</span>.
        Adjusted for sample size with{" "}
        <strong className="font-medium text-[var(--color-text-primary)]">Bayesian smoothing</strong>,
        the estimate is{" "}
        <span className="font-mono font-medium text-[var(--color-amber-glow)]">{smoothPct}%</span>
        — pulled toward the typical hit rate when analog counts are thin.
      </p>
    </div>
  );
}
