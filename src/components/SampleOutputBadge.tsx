/**
 * SampleOutputBadge (AIC-893 / AIC-892 design system).
 *
 * The mandatory, non-dismissible label that MUST appear on every illustrative
 * product artifact so a "sample" is never mistaken for a real person's result
 * (AIC-889 / FTC guardrail). Amber, uppercase, high-contrast (WCAG AA).
 *
 * - `short` (default): compact "SAMPLE OUTPUT" pill for cards/panels.
 * - `long`: full disclaimer for standalone/hero contexts.
 */

const LONG_LABEL = "Sample output — a product example, not a real person's result";
const SHORT_LABEL = "Sample output";

export default function SampleOutputBadge({
  variant = "short",
  className = "",
}: {
  variant?: "short" | "long";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300 ${className}`}
    >
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
      {variant === "long" ? LONG_LABEL : SHORT_LABEL}
    </span>
  );
}
