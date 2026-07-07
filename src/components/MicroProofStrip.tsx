/**
 * MicroProofStrip (AIC-753)
 *
 * Inline metrics row shown below the hero subtitle:
 *   ★4.8 avg rating · 92% recommend · $15K avg salary uplift
 * Values come from PROOF_METRICS; labels are localized. Collapses to a
 * vertical stack on mobile (< sm) per the design spec.
 */
export interface MicroProofMetric {
  value: string;
  label: string;
  /** Render a leading star glyph (used for the rating metric) */
  star?: boolean;
}

export default function MicroProofStrip({ metrics }: { metrics: MicroProofMetric[] }) {
  return (
    <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-5 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800/60 backdrop-blur-sm">
      {metrics.map((m, i) => (
        <div key={m.label} className="contents sm:flex sm:items-center">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            {m.star && (
              <span className="text-amber-400 text-sm leading-none" aria-hidden>
                ★
              </span>
            )}
            <span className="text-white font-bold">{m.value}</span>
            <span>{m.label}</span>
          </div>
          {i < metrics.length - 1 && (
            <span className="hidden sm:block w-px h-4 bg-slate-800 mx-1" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
