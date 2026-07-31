/**
 * EarlyAccessBanner (AIC-893 / REBUILD-HONEST Tier 2).
 *
 * Turns "new, no testimonials yet" into an honest reason to act: early-access /
 * founding-cohort positioning. Deliberately makes NO scarcity or discount claim
 * we can't substantiate — no fake countdown, no invented "price goes up soon."
 * Just true early-stage framing plus the real, already-live guarantee.
 */
import { Link } from "@/i18n/navigation";
import { Rocket } from "lucide-react";

export default function EarlyAccessBanner({
  href = "/pricing",
  onCtaClick,
  className = "",
}: {
  href?: string;
  onCtaClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-4 rounded-2xl border border-teal-700/40 bg-gradient-to-br from-teal-950/40 to-slate-900/40 p-6 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15">
          <Rocket className="h-5 w-5 text-teal-400" aria-hidden />
        </span>
        <div>
          <div className="mb-1 inline-flex items-center rounded-full border border-teal-700/50 bg-teal-950/50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal-300">
            Early access
          </div>
          <h3 className="text-lg font-bold text-white">You&rsquo;re getting in early</h3>
          <p className="mt-1 max-w-md text-sm text-slate-400">
            AICareerPivot is newly launched and improving fast. Try it now, and if the report
            isn&rsquo;t useful you&rsquo;re covered by our 30-day money-back guarantee.
          </p>
        </div>
      </div>
      <Link
        href={href}
        onClick={onCtaClick}
        className="shrink-0 rounded-xl bg-teal-600 px-6 py-3 text-center font-bold text-white transition-colors hover:bg-teal-500"
      >
        Build my pivot plan — $19
      </Link>
    </div>
  );
}
