interface Props {
  variant?: "dark" | "light";
}

export function AppFooter({ variant = "light" }: Props) {
  const isDark = variant === "dark";
  return (
    <footer
      className={[
        "py-8 text-center text-xs",
        isDark
          ? "border-t border-[var(--color-rim)] text-[var(--color-ash)]"
          : "text-[var(--color-slate-ui)]",
      ].join(" ")}
    >
      Historical analog analysis only. Not financial advice.
    </footer>
  );
}
