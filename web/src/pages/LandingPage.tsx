import { Link } from "react-router-dom";
import { AnalogMatchDemo } from "../components/landing/AnalogMatchDemo";
import { ContourPreviewDemo } from "../components/landing/ContourPreviewDemo";
import { HeroCpBlurb } from "../components/landing/HeroCpBlurb";
import { MathPreviewDemo } from "../components/landing/MathPreviewDemo";
import { ProbabilityDemo } from "../components/landing/ProbabilityDemo";
import { AppFooter } from "../components/layout/AppFooter";
import { SiteNavbar } from "../components/layout/SiteNavbar";
import { useLandingPreview } from "../hooks/useLandingPreview";
import type { LandingPreviewResponse } from "../types/landing";

const STEPS = [
  {
    num: "01",
    title: "Where is price vs. its average?",
    body: "Pick a date and a moving-average window H. We compare Bitcoin's close to its H-day average — above, below, or right on it.",
  },
  {
    num: "02",
    title: "Find days that looked similar",
    body: "We scan history for days with a similar price-to-average ratio (within a small tolerance ε) and the same above/below relationship.",
  },
  {
    num: "03",
    title: "See what happened next",
    body: "For each forward horizon T, we count how often price rose or fell. That's your conditional probability — grounded in analogs, not a model forecast.",
  },
] as const;

const PAGES = [
  {
    to: "/overview",
    tag: "Overview",
    title: "Today's snapshot",
    body: "Plain-language summary of where Bitcoin sits vs. its moving average and what similar past days did next.",
    demo: "probability" as const,
  },
  {
    to: "/methodology",
    tag: "Methodology",
    title: "How the math works",
    body: "Formal definitions of analog sets, conditional probability, and Bayesian smoothing — for readers who want the full picture, alongside the CMAPS method paper.",
    demo: "math" as const,
  },
  {
    to: "/plots",
    tag: "Plots",
    title: "Interactive explorer",
    body: "Price charts, H×T contour maps, strategy rankings, and k-distribution — dig into any date and parameter combo.",
    demo: "contour" as const,
  },
] as const;

function DemoPanel({
  type,
  preview,
}: {
  type: "probability" | "math" | "contour";
  preview: LandingPreviewResponse;
}) {
  if (type === "probability") {
    return (
      <ProbabilityDemo
        bars={preview.ma_bars}
        defaultT={preview.default_T}
        relation={preview.relation}
      />
    );
  }
  if (type === "contour") {
    return <ContourPreviewDemo snippet={preview.contour_snippet} />;
  }
  return <MathPreviewDemo epsilon={preview.k_wiggle} />;
}

function relationBadge(relation: string) {
  if (relation === "below") return "below MA";
  if (relation === "above") return "above MA";
  return "at MA";
}

export function LandingPage() {
  const { data: preview, loading, error } = useLandingPreview();

  return (
    <div className="site-canvas">
      <div className="site-grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <SiteNavbar />

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <section className="pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
              Historical analog analysis for Bitcoin
            </span>
          </div>

          <h1 className="font-display max-w-3xl text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
            What happened after days that looked like today?
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            CMAPS matches today's Bitcoin setup to similar past days — same position
            relative to a moving average — then shows how often price rose or fell
            afterward. No predictions. Just history, counted.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/overview" className="site-cta px-6 py-3 text-sm">
              Explore today's analysis
            </Link>
            <Link to="/methodology" className="site-ghost px-5 py-2.5 text-sm font-medium">
              How it works
            </Link>
          </div>

          <div
            className="site-card relative mt-14 overflow-hidden p-1 sm:mt-20"
            style={{ boxShadow: "var(--shadow-surface), var(--shadow-glow)" }}
          >
            <div className="rounded-[10px] bg-[var(--color-card-inner)] p-4 sm:p-6">
              {loading && (
                <div className="flex h-48 items-center justify-center sm:h-56">
                  <p className="text-sm text-[var(--color-text-muted)]">Loading live preview…</p>
                </div>
              )}
              {error && (
                <div className="flex h-48 items-center justify-center sm:h-56">
                  <p className="text-sm text-[var(--color-rose)]">{error}</p>
                </div>
              )}
              {preview && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      overview · H={preview.chart_H} · {relationBadge(preview.relation)} ·{" "}
                      {preview.resolved_date}
                    </span>
                    <span className="rounded bg-[var(--color-amber)]/15 px-2 py-0.5 font-mono text-[10px] text-[var(--color-amber-glow)]">
                      live data
                    </span>
                  </div>
                  <HeroCpBlurb preview={preview} />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="chart-frame h-52 p-2 sm:h-60">
                      <AnalogMatchDemo preview={preview} />
                    </div>
                    <div className="chart-frame h-52 p-2 sm:h-60">
                      <ProbabilityDemo
                        bars={preview.ma_bars}
                        defaultT={preview.default_T}
                        relation={preview.relation}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-amber)]">
            Three steps
          </p>
          <h2 className="font-display mt-3 max-w-lg text-3xl font-medium tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            History as your reference set
          </h2>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.num} className="site-card p-6">
                <span className="font-mono text-xs text-[var(--color-amber)]">{step.num}</span>
                <h3 className="font-display mt-3 text-lg font-medium text-[var(--color-text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-[var(--color-border)] py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-indigo)]">
            Inside the tool
          </p>
          <h2 className="font-display mt-3 max-w-lg text-3xl font-medium tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Three views, one dataset
          </h2>

          <ul className="mt-12 space-y-8">
            {PAGES.map((page, i) => (
              <li
                key={page.to}
                className={[
                  "grid items-center gap-8 lg:grid-cols-2",
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : "",
                ].join(" ")}
              >
                <div>
                  <span className="font-mono text-xs text-[var(--color-amber)]">{page.tag}</span>
                  <h3 className="font-display mt-2 text-2xl font-medium text-[var(--color-text-primary)]">
                    {page.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {page.body}
                  </p>
                  <Link
                    to={page.to}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-amber-glow)] hover:underline"
                  >
                    Open {page.tag.toLowerCase()}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
                <div className="site-card chart-frame h-56 p-3 sm:h-64">
                  {preview ? (
                    <DemoPanel type={page.demo} preview={preview} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
                      {loading ? "Loading…" : error ?? "Preview unavailable"}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-[var(--color-border)] py-20 text-center sm:py-28">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Ready to look at today?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--color-text-secondary)]">
            Pick a date, choose your moving-average window, and see what similar
            historical days did next.
          </p>
          <Link to="/overview" className="site-cta mt-8 inline-block px-8 py-3 text-sm">
            Open overview
          </Link>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
