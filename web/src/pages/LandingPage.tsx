import { Link } from "react-router-dom";
import { AnalogMatchDemo } from "../components/landing/AnalogMatchDemo";
import { ContourPreviewDemo } from "../components/landing/ContourPreviewDemo";
import { ProbabilityDemo } from "../components/landing/ProbabilityDemo";
import { AppFooter } from "../components/layout/AppFooter";
import { LandingNavbar } from "../components/layout/LandingNavbar";

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
    body: "Formal definitions of analog sets, conditional probability, and Bayesian smoothing — for readers who want the full picture.",
    demo: "analog" as const,
  },
  {
    to: "/plots",
    tag: "Plots",
    title: "Interactive explorer",
    body: "Price charts, H×T contour maps, strategy rankings, and k-distribution — dig into any date and parameter combo.",
    demo: "contour" as const,
  },
] as const;

function DemoPanel({ type }: { type: "probability" | "analog" | "contour" }) {
  if (type === "probability") return <ProbabilityDemo />;
  if (type === "contour") return <ContourPreviewDemo />;
  return (
    <div className="p-2">
      <AnalogMatchDemo />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-canvas min-h-screen">
      <div className="landing-grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <LandingNavbar />

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-rim)] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
            <span className="font-mono text-xs text-[var(--color-mist)]">
              Historical analog analysis for Bitcoin
            </span>
          </div>

          <h1 className="font-display max-w-3xl text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-snow)] sm:text-5xl lg:text-6xl">
            What happened after days that looked like today?
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-mist)] sm:text-lg">
            CPMAB matches today's Bitcoin setup to similar past days — same position
            relative to a moving average — then shows how often price rose or fell
            afterward. No predictions. Just history, counted.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/overview" className="landing-cta px-6 py-3 text-sm">
              Explore today's analysis
            </Link>
            <Link
              to="/methodology"
              className="landing-ghost px-5 py-2.5 text-sm font-medium"
            >
              How it works
            </Link>
          </div>

          {/* Hero product preview */}
          <div className="landing-card relative mt-14 overflow-hidden p-1 sm:mt-20" style={{ boxShadow: "var(--shadow-panel), var(--shadow-glow)" }}>
            <div className="rounded-[10px] bg-[var(--color-panel)] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--color-ash)]">overview · H=200 · below MA</span>
                <span className="rounded bg-[var(--color-amber)]/15 px-2 py-0.5 font-mono text-[10px] text-[var(--color-amber-glow)]">
                  live data
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-48 sm:h-56">
                  <AnalogMatchDemo />
                </div>
                <div className="h-48 sm:h-56">
                  <ProbabilityDemo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[var(--color-rim)] py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-amber)]">
            Three steps
          </p>
          <h2 className="font-display mt-3 max-w-lg text-3xl font-medium tracking-tight text-[var(--color-snow)] sm:text-4xl">
            History as your reference set
          </h2>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.num} className="landing-card p-6">
                <span className="font-mono text-xs text-[var(--color-amber)]">{step.num}</span>
                <h3 className="font-display mt-3 text-lg font-medium text-[var(--color-snow)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-mist)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Explore sections */}
        <section className="border-t border-[var(--color-rim)] py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-indigo)]">
            Inside the tool
          </p>
          <h2 className="font-display mt-3 max-w-lg text-3xl font-medium tracking-tight text-[var(--color-snow)] sm:text-4xl">
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
                  <h3 className="font-display mt-2 text-2xl font-medium text-[var(--color-snow)]">
                    {page.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-mist)]">
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
                <div className="landing-card h-56 p-4 sm:h-64">
                  <DemoPanel type={page.demo} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--color-rim)] py-20 text-center sm:py-28">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-snow)] sm:text-4xl">
            Ready to look at today?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--color-mist)]">
            Pick a date, choose your moving-average window, and see what similar
            historical days did next.
          </p>
          <Link to="/overview" className="landing-cta mt-8 inline-block px-8 py-3 text-sm">
            Open overview
          </Link>
        </section>
      </main>

      <AppFooter variant="dark" />
    </div>
  );
}
