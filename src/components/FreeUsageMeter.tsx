import Link from "next/link";
import { Sparkles } from "lucide-react";
import InlineGuaranteeBadge from "@/components/InlineGuaranteeBadge";

/**
 * FreeUsageMeter (AIC-844 / design AIC-840)
 *
 * Metered-scarcity countdown shown at the top of a free tool: "X of Y free
 * {noun}s left this month". Concrete countable limits beat vague gating
 * (Jobscan, Huntr). Presentational only — the parent owns the count (see
 * useFreeUsage) so this stays trivially reusable across every free tool.
 *
 * Design lenses: Loss Aversion (counting down what's left), Scarcity Bias
 * (concrete numbers), Goal-Gradient (a depleting bar accelerates action),
 * Von Restorff (distinct container). No dark patterns: real limits, a visible
 * reset date, and the tool itself is never blocked.
 *
 * Three states by remaining allowance: healthy (teal) → low (amber) →
 * critical (red, warm-pulse). At zero it becomes an upgrade banner.
 */

export type UsageMeterState = "healthy" | "low" | "critical" | "depleted";

function meterState(used: number, limit: number): UsageMeterState {
  const remaining = Math.max(0, limit - used);
  if (remaining <= 0) return "depleted";
  if (remaining <= 1) return "critical";
  if (remaining / limit <= 0.5) return "low";
  return "healthy";
}

/** Pluralize the tool's unit noun ("scan" → "scans", "analysis" → "analyses"). */
function plural(noun: string, n: number): string {
  if (n === 1) return noun;
  if (/sis$/.test(noun)) return noun.replace(/sis$/, "ses");
  return `${noun}s`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function resetLabel(resetsAt: string | undefined, period: "month" | "day"): string {
  if (!resetsAt) return period === "day" ? "Resets daily" : "Resets monthly";
  const d = new Date(resetsAt);
  if (Number.isNaN(d.getTime())) {
    return period === "day" ? "Resets daily" : "Resets monthly";
  }
  if (period === "day") return "Resets tomorrow";
  return `Resets ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

const STATE_STYLES: Record<
  Exclude<UsageMeterState, "depleted">,
  { bar: string; text: string; ring: string }
> = {
  healthy: {
    bar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    text: "text-teal-300",
    ring: "border-teal-500/25",
  },
  low: {
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
    text: "text-amber-300",
    ring: "border-amber-500/25",
  },
  critical: {
    bar: "bg-gradient-to-r from-red-500 to-rose-500",
    text: "text-red-300",
    ring: "border-red-500/30",
  },
};

export interface FreeUsageMeterProps {
  used: number;
  limit: number;
  /** Singular unit noun, e.g. "scan". */
  noun: string;
  period?: "month" | "day";
  /** ISO reset timestamp; drives the "Resets …" caption. */
  resetsAt?: string;
  /** Opens an in-page upgrade flow (preferred over a link). */
  onUpgrade?: () => void;
  /** Fallback upgrade destination when no `onUpgrade` handler is given. */
  upgradeHref?: string;
  className?: string;
}

export default function FreeUsageMeter({
  used,
  limit,
  noun,
  period = "month",
  resetsAt,
  onUpgrade,
  upgradeHref = "/pricing",
  className = "",
}: FreeUsageMeterProps) {
  const safeLimit = Math.max(1, limit);
  const safeUsed = Math.min(Math.max(0, used), safeLimit);
  const remaining = safeLimit - safeUsed;
  const state = meterState(safeUsed, safeLimit);
  const periodWord = period === "day" ? "today" : "this month";

  const upgradeCta = (label: string, extraClass = "") => {
    const cls = `inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-500 ${extraClass}`;
    return onUpgrade ? (
      <button type="button" onClick={onUpgrade} className={cls}>
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>
    ) : (
      <Link href={upgradeHref} className={cls}>
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  };

  // Depleted → upgrade banner (the meter has done its job; convert now).
  if (state === "depleted") {
    return (
      <section
        aria-label={`Free ${plural(noun, 0)} used up ${periodWord}`}
        className={`rounded-xl border border-red-500/25 bg-gradient-to-br from-red-950/30 to-rose-900/15 p-4 ${className}`}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              You&apos;ve used all {safeLimit} free {plural(noun, safeLimit)}{" "}
              {periodWord}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {resetLabel(resetsAt, period)} · upgrade for unlimited access now.
            </p>
          </div>
          {upgradeCta("Upgrade — $19", "w-full sm:w-auto shrink-0")}
        </div>
        <div className="mt-3">
          <InlineGuaranteeBadge variant="short" />
        </div>
      </section>
    );
  }

  const styles = STATE_STYLES[state];
  const fillPct = Math.round((remaining / safeLimit) * 100);

  return (
    <section
      aria-label="Free usage remaining"
      className={`rounded-xl border ${styles.ring} bg-slate-800/40 p-4 ${className}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-slate-300">
          <span className={`font-bold ${styles.text}`}>{remaining}</span> of{" "}
          {safeLimit} free {plural(noun, safeLimit)} left {periodWord}
        </p>
        <span className="shrink-0 text-xs text-slate-500">
          {resetLabel(resetsAt, period)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-valuenow={remaining}
        aria-valuetext={`${remaining} of ${safeLimit} free ${plural(
          noun,
          safeLimit,
        )} remaining ${periodWord}`}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${styles.bar} ${
            state === "critical" ? "animate-warm-pulse" : ""
          }`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      {state === "critical" && (
        <p className="mt-2 text-xs text-slate-400">
          Last free {noun} {periodWord} — make it count.
        </p>
      )}
    </section>
  );
}
