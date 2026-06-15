import type { LandingHBlock, LandingTRow, SideCp } from "../types/landing";

function formatPercent(cp: number): string {
  return `${(cp * 100).toFixed(1)}%`;
}

function formatKwiggle(kWiggle: number): string {
  const pct = kWiggle * 100;
  const text = pct >= 1 ? pct.toFixed(1) : pct.toFixed(2);
  return `${text}%`;
}

export function formatTimeframe(T: number): string {
  return `${T} days`;
}

export function activeSide(relation: string): "long" | "short" | null {
  if (relation === "below") return "long";
  if (relation === "above") return "short";
  return null;
}

export function maHeading(relation: string, H: number): string {
  if (relation === "at") {
    return `Matches ${H}-day average exactly`;
  }
  if (relation === "below") {
    return `Below ${H}-day moving average`;
  }
  if (relation === "above") {
    return `Above ${H}-day moving average`;
  }
  return `${H}-day moving average`;
}

export function todayRelationSentence(
  relation: string,
  H: number,
  ma: number,
  formatPrice: (value: number) => string,
): string | null {
  if (relation === "below") {
    return (
      `Bitcoin closed below its ${H}-day moving average of ${formatPrice(ma)}. ` +
      `Past comparisons below use only days that were also below this average.`
    );
  }
  if (relation === "above") {
    return (
      `Bitcoin closed above its ${H}-day moving average of ${formatPrice(ma)}. ` +
      `Past comparisons below use only days that were also above this average.`
    );
  }
  return null;
}

export function atMaExplanation(H: number, formatPrice: (value: number) => string, ma: number): string {
  return (
    `Bitcoin's closing price is exactly the same as its ${H}-day moving average ` +
    `(${formatPrice(ma)}). There is no clear lean toward rising or falling from this ` +
    `position alone, so no forward-looking history is shown.`
  );
}

export function similarDaysIntro(
  kWiggle: number,
  H: number,
  relation: string,
): string {
  const tolerance = formatKwiggle(kWiggle);

  if (relation === "below") {
    return (
      `We matched past days when Bitcoin was also below its ${H}-day average and had a ` +
      `price-to-average ratio within about ${tolerance} of today. Days sitting exactly on ` +
      `the average are excluded.`
    );
  }

  if (relation === "above") {
    return (
      `We matched past days when Bitcoin was also above its ${H}-day average and had a ` +
      `price-to-average ratio within about ${tolerance} of today. Days sitting exactly on ` +
      `the average are excluded.`
    );
  }

  return (
    `When price sits exactly on the ${H}-day average, there is no below or above group ` +
    `to compare against.`
  );
}

export function outlookSectionHeading(relation: string): string {
  if (relation === "below") {
    return `After similar below-average days`;
  }
  if (relation === "above") {
    return `After similar above-average days`;
  }
  return `Historical outcomes`;
}

function outcomeSentence(
  side: "long" | "short",
  T: number,
  stats: SideCp,
): string {
  const timeframe = formatTimeframe(T);

  if (stats.occurrences === 0) {
    return `Not enough comparable past days to summarize what happened after ${timeframe}.`;
  }

  const pct = formatPercent(stats.cp);
  const count = `${stats.hits} of ${stats.occurrences}`;

  if (side === "long") {
    return (
      `In ${pct} of those past days (${count}), Bitcoin's price was higher after ${timeframe}.`
    );
  }

  return (
    `In ${pct} of those past days (${count}), Bitcoin's price was lower after ${timeframe}.`
  );
}

export function smoothedOutcomeSentence(stats: SideCp): string | null {
  if (stats.occurrences === 0) return null;

  const smoothedPct = formatPercent(stats.smoothed_cp);
  return (
    `When the conditional probability is adjusted for the number of samples using ` +
    `Bayesian smoothing, this results in a smoothed conditional probability of ${smoothedPct}.`
  );
}

export interface TimeframeOutlook {
  T: number;
  text: string;
  smoothedText: string | null;
  stats: SideCp;
  side: "long" | "short";
}

export function buildTimeframeOutlooks(
  block: LandingHBlock,
  rows: LandingTRow[],
): TimeframeOutlook[] {
  const side = activeSide(block.relation);
  if (!side) return [];

  return rows.map((row) => {
    const stats = side === "long" ? row.long : row.short;
    return {
      T: row.T,
      stats,
      side,
      text: outcomeSentence(side, row.T, stats),
      smoothedText: smoothedOutcomeSentence(stats),
    };
  });
}
