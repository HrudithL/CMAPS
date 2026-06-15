import { MathBlock } from "../MathBlock";

interface Props {
  epsilon: number;
}

export function MathPreviewDemo({ epsilon }: Props) {
  return (
    <div className="math-preview-demo flex h-full min-h-0 flex-col gap-1.5 p-1">
      <p className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        Core definitions
      </p>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card-inner)]/90 p-2.5 shadow-[inset_0_0_24px_rgba(245,158,11,0.04)]">
        <MathBlock fit>
          {String.raw`k_t(H) = \frac{P_t}{MA_t(H)}`}
        </MathBlock>
        <MathBlock fit>
          {String.raw`|k_t(H) - k_\tau(H)| \le \varepsilon`}
        </MathBlock>
        <MathBlock fit>
          {String.raw`CP = \frac{|A|}{|B|}, \quad CP_{\text{smooth}} = \frac{|A| + m \cdot r}{|B| + m}`}
        </MathBlock>
      </div>
      <p className="shrink-0 font-mono text-[9px] leading-relaxed text-[var(--color-text-muted)]">
        ε = {epsilon.toFixed(3)} · H ∈ {"{65, 200, 365}"} · T = 90
      </p>
    </div>
  );
}
