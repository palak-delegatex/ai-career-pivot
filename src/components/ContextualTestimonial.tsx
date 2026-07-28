import { caseStudies } from "@/lib/testimonials";

/**
 * ContextualTestimonial (AIC-823 / AIC-826)
 *
 * Surfaces the case study whose `beforeRole` best matches the viewer's own
 * background so the social proof reads as "someone like me did this", not a
 * generic quote. Match is a case-insensitive substring of `beforeRole` against
 * `userProfile` (e.g. the free snapshot's profile summary); falls back to the
 * first case study when nothing matches or no profile is available.
 */
export default function ContextualTestimonial({
  userProfile,
}: {
  userProfile?: string;
}) {
  const profile = userProfile?.toLowerCase() ?? "";
  const study =
    (profile &&
      caseStudies.find((c) => profile.includes(c.beforeRole.toLowerCase()))) ||
    caseStudies[0];

  return (
    <div className="rounded-lg p-4 bg-slate-800/50 border border-slate-700">
      <p className="text-sm text-slate-300 italic line-clamp-2">
        &ldquo;{study.quote}&rdquo;
      </p>
      <div className="flex items-center justify-between gap-2 mt-3">
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-300">{study.name}</span> ·{" "}
          {study.beforeRole} → {study.afterRole}
        </p>
        <span className="shrink-0 bg-teal-500/10 text-teal-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {study.keyMetric}
        </span>
      </div>
    </div>
  );
}
