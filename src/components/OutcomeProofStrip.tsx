/**
 * OutcomeProofStrip (AIC-753)
 *
 * Outcome metrics row shown above the pricing cards — anchors the value
 * frame before the visitor sees the price. Collapses to a vertical stack
 * on mobile (< sm). Values come from PROOF_METRICS.
 */
export interface ProofStripMetric {
  value: string;
  label: string;
  /** Optional accent color token for the value (e.g. "text-emerald-400") */
  accent?: string;
  /** Render a trailing star glyph (used for the rating metric) */
  star?: boolean;
}

export default function OutcomeProofStrip({ metrics }: { metrics: ProofStripMetric[] }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6 py-5 rounded-xl bg-slate-900/60 border border-slate-800">
      {metrics.map((m, i) => (
        <div key={m.label} className="contents sm:flex sm:items-center sm:gap-8">
          <div className="flex flex-col items-center gap-0.5">
            <span className={`text-[22px] font-extrabold leading-none ${m.accent ?? "text-white"}`}>
              {m.value}
              {m.star && <span className="text-sm text-amber-400 align-top ml-0.5">★</span>}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">{m.label}</span>
          </div>
          {i < metrics.length - 1 && (
            <span className="hidden sm:block w-px h-8 bg-slate-800" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
