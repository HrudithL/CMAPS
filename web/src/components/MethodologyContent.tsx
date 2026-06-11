import { MathBlock } from "./MathBlock";

interface Props {
  epsilon: number;
}

export function MethodologyContent({ epsilon }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Methodology</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Given moving-average window H and forward horizon T, estimate how often
          Bitcoin rose or fell T days after past dates that looked like today.
        </p>
      </div>

      <div className="methodology-math space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Time index
          </p>
          <p className="mb-2 text-sm text-slate-600">
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

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
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

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Approximate equality (ε = {epsilon})
          </p>
          <MathBlock
            fit
            stacked={String.raw`\begin{aligned} k_t(H) &\approx k_\tau(H) \\ &\Leftrightarrow\; \left|k_t(H) - k_\tau(H)\right| \leq \varepsilon \end{aligned}`}
          >
            {String.raw`k_t(H) \approx k_\tau(H) \;\Leftrightarrow\; \left|k_t(H) - k_\tau(H)\right| \leq \varepsilon`}
          </MathBlock>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Analog sets
          </p>
          <p className="mb-2 text-sm text-slate-600">
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

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
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

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Conditional probability
          </p>
          <MathBlock fit>
            {String.raw`CP_{\text{long}}(H,T) = \frac{\left|A_{\text{long}}(H,T)\right|}{\left|B_{\text{long}}(H)\right|}`}
          </MathBlock>
          <MathBlock fit>
            {String.raw`CP_{\text{short}}(H,T) = \frac{\left|A_{\text{short}}(H,T)\right|}{\left|B_{\text{short}}(H)\right|}`}
          </MathBlock>
        </div>
      </div>
    </div>
  );
}
