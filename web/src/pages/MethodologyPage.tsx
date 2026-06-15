import { useEffect, useState } from "react";
import { fetchMeta } from "../api/client";
import { MethodologyContent } from "../components/MethodologyContent";
import { AppFooter } from "../components/layout/AppFooter";
import { SiteNavbar } from "../components/layout/SiteNavbar";

export function MethodologyPage() {
  const [epsilon, setEpsilon] = useState(0.01);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((meta) => setEpsilon(meta.defaults.k_wiggle))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="site-canvas">
      <div className="site-grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <SiteNavbar />

      <main className="relative mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {error && (
          <div className="mb-6 rounded-xl border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-4 py-3 text-sm text-[var(--color-rose)]">
            {error}
          </div>
        )}
        <MethodologyContent epsilon={epsilon} />
      </main>

      <AppFooter />
    </div>
  );
}
