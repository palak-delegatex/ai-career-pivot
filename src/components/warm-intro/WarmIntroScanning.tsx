"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

// Scanning state — shown while the section resolves the CRM lookup. A minimum
// display window is enforced by the orchestrator (Doherty threshold); this
// component just renders the shimmer + progressive status text.
const STEPS = [
  "Scanning your network for connections",
  "Checking your CRM contacts",
  "Ranking connections by tie strength",
];

export default function WarmIntroScanning({ company }: { company: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Advance the status line every ~1.1s so a slow scan reads as real work.
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      1100,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
        Connections at {company}
      </h3>
      <div
        className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-1.5 mb-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-teal-400/70 shimmer-dot"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          {STEPS[step]} at{" "}
          <span className="text-slate-400 font-medium">{company}</span>…
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          This usually takes a few seconds
        </p>
      </div>
    </div>
  );
}
