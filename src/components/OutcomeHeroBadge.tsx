/**
 * OutcomeHeroBadge (AIC-753 / AIC-862)
 *
 * Hero pill showing a verifiable capability signal (e.g. "9 roles · 30+ paths
 * — AI-adjacent, fully mapped"). Pure presentational — value + label are passed
 * in (sourced from localized messages) so the copy stays translatable.
 */
export default function OutcomeHeroBadge({
  count,
  label,
}: {
  count: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-950/60 border border-teal-500/25 backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span className="text-teal-400 text-sm font-bold">{count}</span>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
  );
}
