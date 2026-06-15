import { Link } from "react-router-dom";

const links = [
  { to: "/overview", label: "Overview" },
  { to: "/methodology", label: "Methodology" },
  { to: "/plots", label: "Plots" },
] as const;

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-rim)] bg-[var(--color-void)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-amber)] text-xs font-bold text-[var(--color-void)]">
            ₿
          </span>
          <span className="font-display text-sm font-medium tracking-tight text-[var(--color-snow)] sm:text-base">
            CPMAB
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--color-mist)] transition-colors hover:text-[var(--color-snow)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          to="/overview"
          className="landing-cta px-4 py-2 text-sm"
        >
          Open tool
        </Link>
      </div>
    </header>
  );
}
