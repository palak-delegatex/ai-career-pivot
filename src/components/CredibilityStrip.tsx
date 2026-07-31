/**
 * CredibilityStrip (AIC-893 — replaces the removed SocialProofStrip).
 *
 * A row of verifiable credibility badges (methodology / data-source / security)
 * sourced from src/lib/credibility.ts. Every badge points to a real source — no
 * fabricated named people, no invented outcome numbers. This is Tier-3 honest
 * proof: "here's what the plan is actually built on," not "here's a testimonial."
 *
 * - `full` (default): icon + label + detail, grid layout for section use.
 * - `mini`: text-only pills for inline use beside a CTA or in a tight slot.
 */
import { Database, Sparkles, Lock, UserCheck } from "lucide-react";
import { CREDIBILITY_SIGNALS, type CredibilitySignal } from "@/lib/credibility";

const ICONS = {
  database: Database,
  sparkles: Sparkles,
  lock: Lock,
  "user-check": UserCheck,
} as const;

function BadgeIcon({ icon, className }: { icon: CredibilitySignal["icon"]; className?: string }) {
  const Cmp = ICONS[icon];
  return <Cmp className={className} aria-hidden />;
}

export default function CredibilityStrip({
  variant = "full",
  signals = CREDIBILITY_SIGNALS,
  className = "",
}: {
  variant?: "full" | "mini";
  signals?: CredibilitySignal[];
  className?: string;
}) {
  if (variant === "mini") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
        {signals.map((s) => (
          <span
            key={s.label}
            title={s.detail}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300"
          >
            <BadgeIcon icon={s.icon} className="h-3.5 w-3.5 text-teal-400" />
            {s.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {signals.map((s) => (
        <div
          key={s.label}
          className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
              <BadgeIcon icon={s.icon} className="h-4 w-4 text-teal-400" />
            </span>
            <span className="text-sm font-semibold text-white leading-tight">{s.label}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}
