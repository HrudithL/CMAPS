import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const links = [
  { to: "/overview", label: "Overview", end: true },
  { to: "/methodology", label: "Methodology", end: false },
  { to: "/plots", label: "Plots", end: false },
] as const;

export function SiteNavbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="site-nav sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-nav-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-[7.5rem] shrink-0 items-center gap-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-amber)] text-xs font-bold text-[var(--color-void)]">
            ₿
          </span>
          <span className="font-display text-sm font-medium tracking-tight text-[var(--color-text-primary)] sm:text-base">
            CMAPS
          </span>
        </Link>

        <nav className="hidden min-w-[18rem] items-center justify-center gap-1 sm:flex">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "inline-flex min-w-[6.5rem] items-center justify-center rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "font-medium text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-[2.5rem] shrink-0 items-center justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="site-ghost flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
