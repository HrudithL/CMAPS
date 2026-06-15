import { NavLink } from "react-router-dom";

const links = [
  { to: "/overview", label: "Overview", end: true },
  { to: "/methodology", label: "Methodology", end: false },
  { to: "/plots", label: "Plots", end: false },
] as const;

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="app-pill-nav mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <NavLink
          to="/"
          className="font-display text-base font-medium tracking-tight text-[var(--color-carbon)] hover:opacity-80"
        >
          CPMAB
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-carbon)] text-[var(--color-paper)]"
                    : "text-[var(--color-graphite)] hover:bg-[var(--color-fog)] hover:text-[var(--color-carbon)]",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
