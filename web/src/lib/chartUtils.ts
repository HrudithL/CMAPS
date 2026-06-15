/** Lightweight chart helpers — SVG/canvas, no Plotly. */

export function linearScale(
  domain: [number, number],
  range: [number, number],
): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

export function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  return [Math.min(...values), Math.max(...values)];
}

export function validNumbers(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v != null && Number.isFinite(v));
}

/** Smooth SVG path through points (Catmull-Rom → cubic bezier). */
export function smoothLinePath(
  points: { x: number; y: number }[],
  tension = 0.35,
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function closedAreaPath(
  linePath: string,
  baselineY: number,
  lastX: number,
  firstX: number,
): string {
  return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
}

/** Managua-inspired heatmap ramp (0–1). */
const HEAT_STOPS: [number, string][] = [
  [0, "#43123e"],
  [0.2, "#883e39"],
  [0.4, "#562949"],
  [0.55, "#5e4fac"],
  [0.7, "#5c84bf"],
  [0.85, "#68a2d5"],
  [1, "#80e7fe"],
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function heatColor(t: number): string {
  const v = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < HEAT_STOPS.length - 1 && v > HEAT_STOPS[i + 1][0]) i++;
  const [t0, c0] = HEAT_STOPS[i];
  const [t1, c1] = HEAT_STOPS[Math.min(i + 1, HEAT_STOPS.length - 1)];
  const f = t1 === t0 ? 0 : (v - t0) / (t1 - t0);
  const [r0, g0, b0] = hexToRgb(c0);
  const [r1, g1, b1] = hexToRgb(c1);
  const r = Math.round(lerp(r0, r1, f));
  const g = Math.round(lerp(g0, g1, f));
  const b = Math.round(lerp(b0, b1, f));
  return `rgb(${r},${g},${b})`;
}

export function formatUsd(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const MAX_HEATMAP_SIDE = 32;

/** Pick ≤maxCount indices spread across [0, length), always including last. */
export function downsampleIndices(length: number, maxCount: number): number[] {
  if (length <= maxCount) return Array.from({ length }, (_, i) => i);
  const step = Math.ceil(length / maxCount);
  const indices: number[] = [];
  for (let i = 0; i < length; i += step) indices.push(i);
  if (indices[indices.length - 1] !== length - 1) indices.push(length - 1);
  return indices;
}

/** Nivo heatmap uses Math.min.apply on all cell values — huge grids overflow the stack. */
export function downsampleContourGrid(
  hValues: number[],
  tValues: number[],
  matrix: (number | null)[][],
  maxSide = MAX_HEATMAP_SIDE,
) {
  const hIdx = downsampleIndices(hValues.length, maxSide);
  const tIdx = downsampleIndices(tValues.length, maxSide);
  return {
    H_values: hIdx.map((i) => hValues[i]),
    T_values: tIdx.map((i) => tValues[i]),
    matrix: hIdx.map((hi) => tIdx.map((ti) => matrix[hi]?.[ti] ?? null)),
    downsampled: hIdx.length < hValues.length || tIdx.length < tValues.length,
  };
}
