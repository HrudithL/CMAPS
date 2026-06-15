import { MathBlock } from "./MathBlock";

interface Props {
  epsilon: number;
}

export function MethodologyContent({ epsilon }: Props) {
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-amber)]">
          Methodology
        </p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          How the math works
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
          Given moving-average window H and forward horizon T, estimate how often
          Bitcoin rose or fell T days after past dates that looked like today.
        </p>
      </header>

      <div className="methodology-math site-card space-y-6 p-5 sm:p-8">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Time index
          </p>
          <p className="mb-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Let τ denote the analysis date (today). Each t is a historical BTC
            trading day strictly before τ, from the first day in the dataset
            through τ − 1 day.
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} t &\in \mathcal{D},\quad t < \tau \\ \mathcal{D} &= \{\text{Day 1 BTC}, \ldots, \tau\} \end{aligned}`}
          >
            {String.raw`t \in \mathcal{D},\quad t < \tau \qquad \mathcal{D} = \{\text{Day 1 BTC}, \ldots, \tau\}`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Price and moving average
          </p>
          <MathBlock fit>
            {String.raw`MA_t(H) = \text{moving average of price over } H \text{ days}`}
          </MathBlock>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} P_t &= k_t(H)\cdot MA_t(H) \\ k_t(H) &= \frac{P_t}{MA_t(H)} \end{aligned}`}
          >
            {String.raw`P_t = k_t(H)\cdot MA_t(H), \quad k_t(H) = \frac{P_t}{MA_t(H)}`}
          </MathBlock>
          <MathBlock fit>
            {String.raw`k_\tau(H) = \frac{P_\tau}{MA_\tau(H)}`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Approximate equality (ε = {epsilon})
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} k_t(H) &\approx k_\tau(H) \\ &\Leftrightarrow\; \left|k_t(H) - k_\tau(H)\right| \leq \varepsilon \end{aligned}`}
          >
            {String.raw`k_t(H) \approx k_\tau(H) \;\Leftrightarrow\; \left|k_t(H) - k_\tau(H)\right| \leq \varepsilon`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Analog sets
          </p>
          <p className="mb-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Price vs. MA is expressed through k<sub>t</sub>: since P<sub>t</sub> =
            k<sub>t</sub>(H)·MA<sub>t</sub>(H), sitting below MA means k
            <sub>t</sub> &lt; 1 (long) and above means k<sub>t</sub> &gt; 1
            (short).
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} B_{\text{long}}(H) = \bigl\{ t < \tau &: k_t(H) \approx k_\tau(H), \\ & k_t(H) < 1 \bigr\} \end{aligned}`}
          >
            {String.raw`B_{\text{long}}(H) = \bigl\{ t < \tau : k_t(H) \approx k_\tau(H),\; k_t(H) < 1 \bigr\}`}
          </MathBlock>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} B_{\text{short}}(H) = \bigl\{ t < \tau &: k_t(H) \approx k_\tau(H), \\ & k_t(H) > 1 \bigr\} \end{aligned}`}
          >
            {String.raw`B_{\text{short}}(H) = \bigl\{ t < \tau : k_t(H) \approx k_\tau(H),\; k_t(H) > 1 \bigr\}`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Long &amp; short outcomes
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} A_{\text{long}}(H,T) = \bigl\{ t \in B_{\text{long}}(H) &: P_{t+T} > P_t \bigr\} \end{aligned}`}
          >
            {String.raw`A_{\text{long}}(H,T) = \bigl\{ t \in B_{\text{long}}(H) : P_{t+T} > P_t \bigr\}`}
          </MathBlock>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} A_{\text{short}}(H,T) = \bigl\{ t \in B_{\text{short}}(H) &: P_{t+T} < P_t \bigr\} \end{aligned}`}
          >
            {String.raw`A_{\text{short}}(H,T) = \bigl\{ t \in B_{\text{short}}(H) : P_{t+T} < P_t \bigr\}`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Conditional probability
          </p>
          <MathBlock fit>
            {String.raw`CP_{\text{long}}(H,T) = \frac{\left|A_{\text{long}}(H,T)\right|}{\left|B_{\text{long}}(H)\right|}`}
          </MathBlock>
          <MathBlock fit>
            {String.raw`CP_{\text{short}}(H,T) = \frac{\left|A_{\text{short}}(H,T)\right|}{\left|B_{\text{short}}(H)\right|}`}
          </MathBlock>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Bayesian smoothing
          </p>
          <p className="mb-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Raw CP can swing when |B| is small. We add m pseudo-observations with
            expected hit rate r, then recompute:
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} CP_{\text{smooth}}(A \mid B) &= \frac{|A \cap B| + m \cdot r}{|B| + m} \\ &= \frac{\text{hits} + m \cdot r}{\text{occurrences} + m} \end{aligned}`}
          >
            {String.raw`CP_{\text{smooth}}(A \mid B) = \frac{|A \cap B| + m \cdot r}{|B| + m} = \frac{\text{hits} + m \cdot r}{\text{occurrences} + m}`}
          </MathBlock>
          <p className="mb-3 mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            <strong>m</strong> (extra samples): defaults to 10% of the median |B| across all
            (H, side) strategy pairs. Adjustable in the Plots analyze bar.
          </p>
          <MathBlock fit>
            {String.raw`m_{\text{default}} = 0.1 \cdot \operatorname{median}_{H,\,\text{side}} \left|B(H)\right|`}
          </MathBlock>
          <p className="mb-3 mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            <strong>r</strong> (expected hit rate): defaults to the median CP across all (H, T,
            side) combinations with at least one analog. Also adjustable in the analyze bar.
          </p>
          <MathBlock fit>
            {String.raw`r_{\text{default}} = \operatorname{median}_{H,T,\,\text{side}} CP(H,T)`}
          </MathBlock>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            When occurrences is large, smoothed CP ≈ raw CP. When occurrences is small,
            smoothed CP is pulled toward r — the typical rate across all strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
