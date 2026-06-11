import { useEffect, useState } from "react";
import { fetchMeta } from "../api/client";
import { MethodologyContent } from "../components/MethodologyContent";
import { Navbar } from "../components/Navbar";

export function MethodologyPage() {
  const [epsilon, setEpsilon] = useState(0.01);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeta()
      .then((meta) => setEpsilon(meta.defaults.k_wiggle))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <MethodologyContent epsilon={epsilon} />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Historical analog analysis only. Not financial advice.
      </footer>
    </div>
  );
}
