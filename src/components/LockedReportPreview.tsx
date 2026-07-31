"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  CalendarClock,
  Wrench,
  ShieldAlert,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import type { ReportTeaser, TeaserSection } from "@/lib/report-teaser";
import type { AtsCategoryScore } from "@/lib/gamified-ats-payload";
import ContextualTestimonial from "@/components/ContextualTestimonial";
import InlineGuaranteeBadge from "@/components/InlineGuaranteeBadge";
import { trackLockedReportPreviewViewed } from "@/lib/tracking";

// Paywall-framing A/B (AIC-884 item 2 — flag `paywall-framing`, Designer contract
// AIC-886). Three variants read in FreeResultsClient and passed down:
//   control  — today's blurred ghost-bar gate (no change)
//   itemized — ghost bars replaced with the section's real count as an explicit
//              "locked value" line (loss aversion made concrete)
//   subscore — the real ATS category sub-scores injected above the catalog, so
//              the user's specific weakness is visible and the locked sections
//              read as the fix (information scent / goal-gradient)
export type PaywallVariant = "control" | "itemized" | "subscore";

// Score-band → bar color (same thresholds as GamifiedATSScore/ScoreRing) so a
// weak sub-score reads red — the honest weakness the report addresses.
function subscoreBar(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
}

// Surface 1: Locked Paid-Report Preview (AIC-879 / design AIC-873, engine AIC-874).
//
// MyPassion.AI's convert mechanic: show a blurred/locked preview of the *actual*
// paid-report sections right below the free result, so the report visibly exists
// — personalized to them — and not unlocking means losing something concrete
// (loss aversion). The section catalog + honest counts + personalized salary /
// timeline come from the live /api/report/teaser engine, which is metadata-only
// (no report body ever crosses the wire), so paid content cannot leak to a
// non-paid client regardless of the `unlocked` flag.

// One icon per engine section id (report-teaser.ts). Falls back to Lock for any
// section the engine adds later, so a new section never crashes the UI.
const SECTION_ICONS: Record<string, LucideIcon> = {
  "path-analysis": Target,
  "skill-plan": Award,
  roadmap: CalendarClock,
  "salary-roi": TrendingUp,
  "week-one": Sparkles,
  "ai-toolkit": Wrench,
  risks: ShieldAlert,
};

// Decreasing-width ghost bars behind each locked card — visual density without
// any real (or fabricated) content. Purely decorative + inert.
const GHOST_WIDTHS = ["85%", "70%", "45%"];

function LockedSectionCard({
  section,
  variant = "control",
}: {
  section: TeaserSection;
  variant?: PaywallVariant;
}) {
  const Icon = SECTION_ICONS[section.id] ?? Lock;
  const countLabel =
    section.count != null
      ? `${section.count}${section.countLabel ? ` ${section.countLabel}` : ""}`
      : null;

  // `itemized` variant: swap the decorative blur for a concrete "locked value"
  // line built from the section's REAL count (no fabrication — same data the
  // count badge shows). Sections without a count keep the ghost bars so the
  // card never looks empty.
  const showItemizedValue = variant === "itemized" && countLabel != null;

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{section.title}</h3>
            {countLabel && (
              <span className="text-[11px] font-semibold text-teal-300 bg-teal-950/40 border border-teal-800/40 rounded-full px-2 py-0.5 shrink-0">
                {countLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{section.blurb}</p>
        </div>
        <Lock className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
      </div>
      {showItemizedValue ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-teal-400/80 shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-teal-300">{countLabel}</span>{" "}
            ready — unlock to view
          </p>
        </div>
      ) : (
        /* Ghost content — blurred, inert, aria-hidden. No real or fake text. */
        <div
          className="mt-3 space-y-2 blur-[6px] select-none pointer-events-none"
          aria-hidden="true"
          inert
        >
          {GHOST_WIDTHS.map((w, i) => (
            <div key={i} className="h-3 rounded bg-slate-700/60" style={{ width: w }} />
          ))}
        </div>
      )}
    </div>
  );
}

// Subscore variant: the real ATS category sub-scores rendered as compact meter
// bars above the section catalog. Reuses the exact meter/a11y pattern from
// GamifiedATSScore. Stacks on mobile, sits in one inline row on `sm:` up to
// avoid pushing the CTA below the fold (AIC-886 §5 mobile-density mitigation).
function SubscoreBreakdown({ categories }: { categories: AtsCategoryScore[] }) {
  if (!categories.length) return null;
  return (
    <div className="mb-5 rounded-xl bg-slate-800/50 border border-slate-700/40 p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Your ATS score breakdown
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        {categories.map((c) => {
          const rounded = Math.round(c.score);
          return (
            <div key={c.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-slate-300">{c.name}</span>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">{rounded}</span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-slate-700 overflow-hidden"
                role="meter"
                aria-valuenow={rounded}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.name}: ${rounded} out of 100`}
              >
                <div
                  className={`h-2 rounded-full ${subscoreBar(c.score)} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(3, Math.min(100, c.score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-3 leading-snug">
        The report below closes the gaps behind these scores.
      </p>
    </div>
  );
}

export default function LockedReportPreview({
  snapshot,
  quickcheckRole,
  onUnlock,
  paywallVariant = "control",
  atsCategories,
}: {
  snapshot: FreeSnapshot;
  quickcheckRole: string | null;
  onUnlock: () => void;
  paywallVariant?: PaywallVariant;
  atsCategories?: AtsCategoryScore[];
}) {
  const [teaser, setTeaser] = useState<ReportTeaser | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    let active = true;
    // Server contract (AIC-874): teaser is always returned (metadata only);
    // `unlocked` comes from the server-side paid-access check. Anonymous
    // /free-results has no email, so `unlocked` is false — the correct default.
    fetch("/api/report/teaser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { teaser: ReportTeaser; unlocked: boolean }) => {
        if (!active) return;
        setTeaser(data.teaser);
        setUnlocked(Boolean(data.unlocked));
        if (!tracked.current) {
          tracked.current = true;
          trackLockedReportPreviewViewed({
            unlocked: Boolean(data.unlocked),
            section_count: data.teaser?.sections?.length ?? 0,
          });
        }
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [snapshot]);

  // Fail silently — the rest of /free-results (gates, upsell) still converts.
  if (failed || !teaser) return null;

  const roleLabel = quickcheckRole ?? snapshot.paths?.[0]?.targetRole ?? "your target role";

  return (
    <section
      role="region"
      aria-label="Paid report preview"
      className="rounded-2xl bg-gradient-to-br from-teal-950/20 to-slate-800/40 border border-teal-800/30 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Lock className="h-5 w-5 text-teal-400 shrink-0" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">Your Full Report</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Personalized to you — built from your snapshot and ready to unlock.
      </p>

      {/* Personalized specifics from the engine (defensible, rule-based ranges). */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            {teaser.salary.display}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{teaser.salary.basis}</p>
        </div>
        <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="flex items-center gap-1.5 text-teal-300 text-sm font-bold">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            {teaser.timeline.display}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{teaser.timeline.basis}</p>
        </div>
      </div>

      {/* Subscore variant — real ATS category bars above the catalog (AIC-884 §2). */}
      {paywallVariant === "subscore" && atsCategories && atsCategories.length > 0 && (
        <SubscoreBreakdown categories={atsCategories} />
      )}

      {/* Locked section catalog */}
      <div className="space-y-3">
        {teaser.sections.map((s) => (
          <LockedSectionCard key={s.id} section={s} variant={paywallVariant} />
        ))}
      </div>

      {/* Social proof matched to the visitor's background (AIC-859 §3c). */}
      <div className="mt-5">
        <ContextualTestimonial userProfile={snapshot.profileSummary} />
      </div>

      {/* Single conversion action */}
      <div className="mt-5 text-center">
        {unlocked ? (
          <Link
            href="/report"
            className="inline-block px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/30"
          >
            View your full report →
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={onUnlock}
              className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/30"
            >
              Unlock Full Report — ${teaser.priceUsd} →
            </button>
            <p className="text-slate-500 text-xs mt-3">
              One-time payment. 30-day money-back guarantee.
            </p>
            <div className="mt-2 flex justify-center">
              <InlineGuaranteeBadge />
            </div>
          </>
        )}
      </div>

      {unlocked && (
        <p className="text-center text-emerald-400 text-xs mt-3 flex items-center justify-center gap-1.5">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Unlocked — your {roleLabel} report is ready.
        </p>
      )}
    </section>
  );
}
