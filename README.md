# CMAPS

**C**onditional **M**oving-**A**verage **P**robabilistic **S**imilarity — an interactive dashboard for Bitcoin conditional-probability analysis grounded in historical analogs.

Instead of fitting a predictive model, CMAPS asks a narrower question: *given how Bitcoin sits relative to its moving average today, how often did price rise or fall over the next T days after past days that looked similar?* Every number on the site is a count over identifiable historical dates — hits, misses, and the analog days behind them are all inspectable.

**Full product spec:** [SPEC.md](./SPEC.md)

---

## Financial framing

Moving averages are a common way to summarize trend. CMAPS encodes “where is price vs. trend?” with two knobs:

- **H** — length of the moving-average window (e.g. 200 days).
- **k** — the price-to-average ratio \(k = P / \mathrm{MA}(H)\).

When \(k < 1\), price closed **below** its H-day average (mean-reversion / dip framing → **long** side). When \(k > 1\), price closed **above** (extension / overbought framing → **short** side). Days exactly on the average (\(k = 1\)) are treated as neutral — no directional analog set.

The forward question is equally simple: over horizon **T** calendar days, did price end higher (long hit) or lower (short hit)?

CMAPS does not recommend trades. It surfaces empirical frequencies from Bitcoin’s daily close history so you can judge whether “similar setups” historically leaned one way — and how sensitive that lean is to H, T, and match tolerance.

---

## Method (at a glance)

Let \(\tau\) be the analysis date. For each historical day \(t < \tau\):

1. Compute \(\mathrm{MA}_t(H)\) and \(k_t(H) = P_t / \mathrm{MA}_t(H)\).
2. **Match** days where \(|k_t(H) - k_\tau(H)| \leq \varepsilon\) (tolerance ε, “k wiggle” in the UI).
3. Split matches by side — long analogs have \(k_t < 1\); short analogs have \(k_t > 1\) (strict inequality; \(k_t = 1\) excluded).
4. **Count outcomes** T days forward: long hit if \(P_{t+T} > P_t\); short hit if \(P_{t+T} < P_t\).

**Conditional probability:**

\[
CP_{\text{long}}(H,T) = \frac{|\{ t \in B_{\text{long}} : P_{t+T} > P_t \}|}{|B_{\text{long}}|}
\qquad
CP_{\text{short}}(H,T) = \frac{|\{ t \in B_{\text{short}} : P_{t+T} < P_t \}|}{|B_{\text{short}}|}
\]

where \(B_{\text{long}}\) and \(B_{\text{short}}\) are the matched analog sets for window H.

**Bayesian smoothing** stabilizes raw CP when analog counts are small:

\[
CP_{\text{smooth}} = \frac{\text{hits} + m \cdot r}{\text{occurrences} + m}
\]

with pseudo-count \(m\) and prior hit rate \(r\) (defaults derived from the full strategy grid; adjustable on the Plots page). Large \(|B|\) → smoothed CP ≈ raw CP; small \(|B|\) → estimate shrinks toward \(r\).

Formal notation and definitions: **Methodology** page in the app, or the LaTeX method note in `paper/` (local only).

---

## Parameters

| Symbol | UI name | Role |
|--------|---------|------|
| \(\tau\) | Analysis date | “Today” for the study; only data strictly before \(\tau\) enters analog sets |
| H | MA window | Days in the trailing simple moving average |
| T | Forward horizon | Calendar days from analog entry to outcome check |
| \(\varepsilon\) | k wiggle | Max absolute deviation in \(k\) for a day to count as “similar” |
| m, r | Smoothing | Bayesian prior strength and expected hit rate |

Default grids for H and T (e.g. H ∈ {65, …, 1000}, T ∈ {90, …, 1095}) live in `config/pred_info.yaml`. The explorer sweeps these to rank (H, T) pairs by CP and plot H×T contour maps.

---

## What the website shows

| Page | Purpose |
|------|---------|
| **/** (Landing) | Three-step intuition: price vs. MA → find similar days → read forward frequencies |
| **/overview** | Plain-language snapshot for the chosen date: relation to MA, matched analog count, CP across forward horizons |
| **/methodology** | Full math: analog sets \(B_{\text{long}}\), \(B_{\text{short}}\), outcome sets, CP formulas, smoothing |
| **/plots** | Interactive lab: price + MA chart with analog markers, k-distribution, CP contours over (H, T), ranked strategies, per-strategy drill-down listing every analog date, entry/exit price, and hit/miss |

The Plots page is the core research surface — change date, H, T, and ε; URL query params preserve a view for sharing (`?date=…&H=…&T=…&k_wiggle=…`).

---

## Data

Daily Bitcoin **closing prices** from 2010 onward (`data/Bitcoin_2010.csv`). Analysis uses calendar-day indexing; forward outcomes require T days of future data still in the series.

---

## Lineage

CMAPS implements the conditional-probability workflow from the `pred_info` research line in the parent Bitcoin_mstr project — the same analog-matching logic that produced static PDF reports, now as a transparent, explorable web dashboard.

---

## Disclaimer

Historical analog analysis only. Past conditional frequencies do not guarantee future results. Not financial advice.
