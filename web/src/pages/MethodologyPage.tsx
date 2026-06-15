import { useEffect, useState } from "react";
import { fetchMeta } from "../api/client";
import { MethodologyContent } from "../components/MethodologyContent";
import { AppFooter } from "../components/layout/AppFooter";
import { AppNavbar } from "../components/layout/AppNavbar";

export function MethodologyPage() {
  const [epsilon, setEpsilon] = useState(0.01);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((meta) => setEpsilon(meta.defaults.k_wiggle))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="app-canvas min-h-screen">
      <AppNavbar />

      <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        <MethodologyContent epsilon={epsilon} />
      </main>

      <AppFooter />
    </div>
  );
}
