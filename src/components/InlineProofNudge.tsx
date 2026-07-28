/**
 * InlineProofNudge (AIC-823 / AIC-826)
 *
 * Compact social-proof row for placement directly above a conversion CTA. Shows
 * a small stack of avatar chips + an aggregate count + verb ("+847 unlocked
 * their full roadmap") so the value the button unlocks is anchored to how many
 * others already took the action. The `count` flows from PROOF_METRICS so this
 * never drifts from the other proof surfaces (see src/lib/proof-metrics.ts).
 */
export default function InlineProofNudge({
  count,
  verb,
  avatarCount = 4,
}: {
  count: string;
  verb: string;
  avatarCount?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <div className="flex items-center pl-2" aria-hidden="true">
        {Array.from({ length: avatarCount }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-teal-500/40 ring-2 ring-white/20 -ml-2"
          />
        ))}
      </div>
      <span>
        {/* Strip a trailing "+" so a count like "847+" doesn't render "+847+". */}
        <span className="font-semibold text-white">
          +{count.replace(/\+$/, "")}
        </span>{" "}
        {verb}
      </span>
    </div>
  );
}
