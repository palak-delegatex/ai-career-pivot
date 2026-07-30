"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Check, Briefcase, TrendingUp, Sparkles, Link as LinkIcon, Mail } from "lucide-react";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import type { UserProfile } from "@/lib/intake";
import type { GamifiedAtsPayload } from "@/lib/gamified-ats-payload";
import { testimonials } from "@/lib/testimonials";
import SocialProofStrip from "@/components/SocialProofStrip";
import UpgradeComparisonSheet from "@/components/UpgradeComparisonSheet";
import ContextualUpgradePrompt from "@/components/ContextualUpgradePrompt";
import PartialRoadmapReveal from "@/components/PartialRoadmapReveal";
import LockedReportPreview from "@/components/LockedReportPreview";
import GamifiedATSScore from "@/components/GamifiedATSScore";
import HonestProofBadge from "@/components/HonestProofBadge";
import { PROOF_METRICS } from "@/lib/proof-metrics";
import { trackFreeEmailCaptured, trackUpgradeSheetOpened, trackFreeResultsViewed } from "@/lib/tracking";

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-950/40 border-red-800/40",
  medium: "text-yellow-400 bg-yellow-950/30 border-yellow-800/30",
  low: "text-emerald-400 bg-emerald-950/30 border-emerald-800/30",
};

function MatchScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#2dd4bf" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} stroke="#334155" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r={radius}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{score}</span>
      </div>
    </div>
  );
}

function JobTeaser({ targetRole, jobCount }: { targetRole: string; jobCount: number }) {
  if (jobCount === 0) return null;
  return (
    <div className="rounded-xl bg-gradient-to-r from-teal-950/40 to-emerald-950/30 border border-teal-800/30 p-4 flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-900/50 border border-teal-700/40 shrink-0">
        <Briefcase className="h-5 w-5 text-teal-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {jobCount} job{jobCount > 1 ? "s" : ""} hiring for {targetRole}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          Personalized match scores available in full report
        </p>
      </div>
    </div>
  );
}

/**
 * Salary trajectory gate backdrop (AIC-824). Current estimate anchors the left
 * (rendered as real text when a truthful number is available; masked otherwise
 * — we never fabricate a salary). The right/"target" side is the paid
 * prescription: a `TrendingUp` "projected increase" with the destination number
 * withheld, and the right 60% of the gradient bar blurred.
 */
function GhostSalaryTrajectory({
  uplift,
  direction,
  currentSalary,
}: {
  uplift: number;
  direction: "up";
  currentSalary?: string;
}) {
  return (
    <div className="p-4 bg-slate-800/40">
      <div className="flex items-center justify-between gap-3">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Current</p>
          <p className="text-lg font-bold text-slate-300">{currentSalary ?? "$XXX,XXX"}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
            {direction === "up" && <TrendingUp className="w-3 h-3" />}+${uplift}K
          </span>
          {/* Left 40% sharp (where you are), right 60% blurred (where you could be). */}
          <div className="relative w-full h-1.5 rounded-full bg-gradient-to-r from-slate-600 to-emerald-500 mt-1 overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 w-3/5 backdrop-blur-[2px] bg-slate-900/20"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Target</p>
          <p className="inline-flex items-center gap-1 text-lg font-bold text-emerald-300 blur-[3px] select-none" aria-hidden="true">
            <TrendingUp className="w-4 h-4" />
          </p>
          <p className="text-[10px] text-emerald-300/70">projected increase</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">Bridge budget + ROI breakeven timeline included</p>
    </div>
  );
}

/**
 * Deferred email capture (AIC-618 D1 / AIC-776). Email is no longer asked for
 * on the upload form — the user sees value first, then opts in here to have the
 * snapshot (and the follow-up nurture) sent to them. Purely additive: skipping
 * it never blocks access to the results already on screen.
 */
function EmailCaptureCard({
  snapshot,
  profile,
}: {
  snapshot: FreeSnapshot;
  profile: UserProfile | null;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/intake/free-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, snapshot, profile }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      trackFreeEmailCaptured({ source: "free_results" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-teal-950/30 border border-teal-800/40 p-5 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-600/20 border border-teal-600/40 mb-2">
          <Check className="w-5 h-5 text-teal-300" />
        </div>
        <p className="text-sm font-semibold text-white">Sent — check your inbox</p>
        <p className="text-xs text-slate-400 mt-1">
          Your snapshot is on its way. We&apos;ll only send what&apos;s useful.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-teal-400 shrink-0" />
        <p className="text-sm font-semibold text-white">Email me this snapshot</p>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Get your results and matched paths sent to your inbox so you can pick this back up later.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={status === "sending"}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "sending" ? "Sending…" : "Email it to me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">
          Please enter a valid email and try again.
        </p>
      )}
    </div>
  );
}

function buildShareUrl(snapshot: FreeSnapshot) {
  const paths = snapshot.paths.map((p) => ({
    role: p.targetRole,
    match: p.matchScore,
  }));
  const params = new URLSearchParams();
  params.set("paths", JSON.stringify(paths));
  if (snapshot.topTransferableStrengths?.length) {
    params.set("strengths", JSON.stringify(snapshot.topTransferableStrengths.map((s) => s.skill)));
  }
  return `/api/og/career-map?${params.toString()}`;
}

export default function FreeResultsClient() {
  const [snapshot, setSnapshot] = useState<FreeSnapshot | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  // Role the visitor checked in the /free quick-check (AIC-859 §2a). When present
  // it personalizes the header, skill-gap header, upsell title/bullet and the
  // strengths subtitle so the results read as "your [role] plan", not generic.
  const [quickcheckRole, setQuickcheckRole] = useState<string | null>(null);
  // Live gamified ATS score (AIC-879 §2). Computed in the background on /free
  // (only when the visitor pasted a JD in the quick-check) and handed over via
  // sessionStorage; null when there's no JD to score against, in which case
  // Surface 2 simply doesn't render.
  const [atsPayload, setAtsPayload] = useState<GamifiedAtsPayload | null>(null);
  // Personalized free-vs-paid comparison drawer (AIC-777). `upgradeSource` is
  // non-null while open and records which surface opened it (funnel attribution).
  const [upgradeSource, setUpgradeSource] = useState<string | null>(null);

  const openUpgrade = useCallback(
    (source: string) => {
      setUpgradeSource(source);
      trackUpgradeSheetOpened({ source, target_role: snapshot?.paths[0]?.targetRole });
    },
    [snapshot],
  );

  const topPath = snapshot?.paths[0];
  const shareText = topPath
    ? `I'm a ${topPath.matchScore}% match for ${topPath.targetRole}! See where your career could go:`
    : "See where your career could go:";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/free` : "https://ai-career-pivot.com/free";

  const handleShare = useCallback(async () => {
    if (!snapshot) return;
    const text = shareText;
    const url = shareUrl;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Career Snapshot", text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snapshot, shareText, shareUrl]);

  useEffect(() => {
    try {
      setQuickcheckRole(sessionStorage.getItem("quickcheck_role"));
    } catch {
      /* sessionStorage may be unavailable (private mode) — non-fatal */
    }
    const raw = sessionStorage.getItem("free_snapshot");
    if (!raw) { setNotFound(true); return; }
    try {
      const parsed = JSON.parse(raw);
      setSnapshot(parsed);
      // Canonical funnel step 2 (AIC-785) — the visitor reached a rendered
      // snapshot. Fired here (not in render) so it emits exactly once per load.
      trackFreeResultsViewed({
        path_count: parsed.paths?.length ?? 0,
        top_match_score: parsed.paths?.[0]?.matchScore ?? 0,
      });
      const rawProfile = sessionStorage.getItem("free_profile");
      if (rawProfile) {
        try { setProfile(JSON.parse(rawProfile)); } catch {}
      }
      if (parsed.paths?.[0]?.targetRole) {
        fetch(`/api/jobs?role=${encodeURIComponent(parsed.paths[0].targetRole)}`)
          .then((r) => r.json())
          .then((d) => setJobCount(d.total ?? 0))
          .catch(() => {});
      }
    } catch {
      setNotFound(true);
    }
  }, []);

  // Pick up the background-computed gamified ATS score (AIC-879 §2). The result
  // is written to sessionStorage by the upload flow after this page has already
  // navigated, so if a computation is still pending we poll briefly for it.
  useEffect(() => {
    function readPayload(): boolean {
      try {
        const raw = sessionStorage.getItem("free_ats_gamified");
        if (raw) {
          setAtsPayload(JSON.parse(raw) as GamifiedAtsPayload);
          return true;
        }
      } catch {
        /* malformed/unavailable — treat as absent */
      }
      return false;
    }
    if (readPayload()) return;
    // Only poll while the upload flow flagged a computation in flight.
    let pending = false;
    try {
      pending = sessionStorage.getItem("free_ats_pending") === "1";
    } catch {
      /* ignore */
    }
    if (!pending) return;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1200;
      let stillPending = false;
      try {
        stillPending = sessionStorage.getItem("free_ats_pending") === "1";
      } catch {
        /* ignore */
      }
      if (readPayload() || !stillPending || elapsed >= 24000) {
        clearInterval(interval);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  if (notFound) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-400 mb-4">No snapshot found. Please upload your resume first.</p>
        <Link href="/free" className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block">
          Get Free Snapshot
        </Link>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your snapshot...</p>
      </main>
    );
  }

  // Single best-match focus (Hick's Law) — always show the #1 ranked path.
  const activePath = snapshot.paths[0];
  const salaryUplift = snapshot.estimatedSalaryUplift ?? 15;
  const marcusTestimonial = testimonials.find((t) => t.name === "Marcus T.")!;

  // Gate zone 1 backing data. The first milestone is a real, personalized step
  // derived from the user's own top skill gap (honest "diagnosis free" teaser);
  // the remaining milestones are ghost placeholders that render only as blurred
  // silhouettes, so no fabricated specifics are ever shown legibly.
  const roadmapMilestones = activePath
    ? [
        {
          title: activePath.topSkillGaps[0]
            ? `Build ${activePath.topSkillGaps[0].skill} foundations`
            : `Foundations for ${activePath.targetRole}`,
          timeline: "First 90 days",
          actions: [
            activePath.topSkillGaps[0]
              ? `Close your highest-priority gap: ${activePath.topSkillGaps[0].skill}`
              : "Close your highest-priority skill gap",
            "Ship one portfolio project that proves the skill",
          ],
        },
        {
          title: "Land a transitional role",
          timeline: "Months 4–9",
          actions: ["Target bridge roles that reward your existing strengths", "Rework your resume for ATS + recruiters"],
        },
        {
          title: `Complete your pivot to ${activePath.targetRole}`,
          timeline: "Months 10–18",
          actions: ["Interview at target-tier companies", "Negotiate to your target comp band"],
        },
        {
          title: "Compound your new trajectory",
          timeline: "Months 19–24",
          actions: ["Level up into senior scope", "Build a durable AI-adjacent specialization"],
        },
      ]
    : [];

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold">
            Free Skill-Gap Snapshot
          </div>
          <HonestProofBadge variant="compact" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          {quickcheckRole ? `Your Match for ${quickcheckRole}` : "Your Top Career Pivot Match"}
        </h1>
        {snapshot.profileSummary && (
          <p className="text-slate-400 text-sm">{snapshot.profileSummary}</p>
        )}
      </div>

      {/* OG image preview (hidden, for social sharing meta) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={buildShareUrl(snapshot)} alt="" className="hidden" />

      {/* Transferable strengths with confidence bars */}
      {snapshot.topTransferableStrengths?.length > 0 && (
        <div className="rounded-2xl bg-teal-950/30 border border-teal-800/30 p-5 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">Strengths You Didn&apos;t Know You Had</h2>
          </div>
          {quickcheckRole && (
            <p className="text-sm text-slate-300 mb-4">These carry over directly to {quickcheckRole}</p>
          )}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${quickcheckRole ? "" : "mt-4"} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}>
            {snapshot.topTransferableStrengths.map((s) => (
              <div key={s.skill} className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-4">
                <p className="text-sm font-semibold text-white mb-1">{s.skill}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000 ease-out"
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-teal-400 w-8 text-right">{s.confidence}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.aiBoostExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single best-match hero card */}
      {activePath && (
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <MatchScoreRing score={activePath.matchScore} />
            <div>
              <h2 className="text-xl font-bold">{activePath.targetRole}</h2>
              <p className="text-slate-400 text-sm">{activePath.targetIndustry}</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">{activePath.rationale}</p>
            </div>
          </div>

          {/* Top skill gaps */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {quickcheckRole ? `Skill Gaps vs. ${quickcheckRole} Requirements` : "Top Skill Gaps to Close"}
            </p>
            <div className="space-y-2">
              {activePath.topSkillGaps.map((gap) => (
                <div key={gap.skill} className="flex items-center gap-3 rounded-lg bg-slate-700/30 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{gap.skill}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${PRIORITY_COLORS[gap.priority]}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-600">
                        <div
                          className="h-1.5 rounded-full bg-teal-500"
                          style={{ width: `${gap.transferabilityScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-20 text-right">
                        {gap.transferabilityScore}% carries over
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job teaser */}
          <JobTeaser targetRole={activePath.targetRole} jobCount={jobCount} />
        </div>
      )}

      {/* Surface 2 — live gamified ATS score + fix-this checklist (AIC-879 §2).
          Renders only when the visitor pasted a JD in the quick-check, so we
          have a real target to score against (no JD ⇒ no fabricated score). */}
      {atsPayload && (
        <div className="mb-6">
          <GamifiedATSScore payload={atsPayload} />
        </div>
      )}

      {/* Gate zone 1 — Partial roadmap reveal (AIC-824). First milestone fully
          legible; the rest fade behind progressive blur. Replaces the old
          separate "other paths" + "milestone timeline" gates. */}
      {activePath && (
        <div className="mb-6">
          <PartialRoadmapReveal
            milestones={roadmapMilestones}
            visibleCount={1}
            totalCount={roadmapMilestones.length}
            onUnlock={() => openUpgrade("gate_roadmap")}
          />
        </div>
      )}

      {/* Surface 1 — Locked paid-report preview (AIC-879 §1). Replaces the old
          text-bullet upsell card: shows the actual paid-report sections as
          blurred/locked cards with honest counts + personalized salary/timeline
          (loss aversion), gated server-side on paid access (AIC-874). This is
          the primary conversion action, one scroll from the match card. */}
      <LockedReportPreview
        snapshot={snapshot}
        quickcheckRole={quickcheckRole}
        onUnlock={() => openUpgrade("locked_report_preview")}
      />
      <div className="mt-3 text-center">
        <Link href="/free" className="text-slate-500 hover:text-slate-300 text-xs underline">
          Try a different resume
        </Link>
      </div>

      {/* Social proof strip — relocated directly beneath the primary conversion
          CTA (was below the share buttons) so the "others like you did this"
          reassurance sits at the decision point (AIC-859 §3e). */}
      <div className="mt-6">
        <SocialProofStrip
          testimonial={marcusTestimonial}
          metrics={[
            { value: PROOF_METRICS.freeSpeed, label: "Free roadmap" },
            { value: PROOF_METRICS.noSignup, label: "To start" },
            { value: PROOF_METRICS.pathsMapped, label: "Paths mapped" },
          ]}
        />
      </div>

      {/* Gate zone 2 — Salary trajectory (AIC-824). Current estimate + up
          direction anchor the free "diagnosis"; the target number and financial
          bridge plan are the paid prescription. */}
      <div className="mb-6 mt-6">
        <ContextualUpgradePrompt
          title="Salary trajectory & financial bridge plan"
          hook={`Estimated +$${salaryUplift}K uplift. See the full current → target model, bridge budget & ROI breakeven.`}
          icon={TrendingUp}
          onUnlock={() => openUpgrade("gate_salary")}
        >
          <GhostSalaryTrajectory uplift={salaryUplift} direction="up" />
        </ContextualUpgradePrompt>
      </div>

      {/* Deferred email capture (D1) — offered after the user has seen value */}
      <div className="mt-6">
        <EmailCaptureCard snapshot={snapshot} profile={profile} />
      </div>

      {/* Share buttons — demoted below the conversion surface (upsell CTA + email
          capture) so they don't compete with the primary action (AIC-807 #3). */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 mt-6">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Copy Link
            </>
          )}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Share on X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </a>
      </div>

      {/* Bottom nudge — distinct from the main CTA above to avoid redundancy */}
      <p className="text-center text-slate-500 text-xs mt-6">
        Still deciding?{" "}
        <button
          type="button"
          onClick={() => openUpgrade("bottom_nudge")}
          className="text-teal-400 hover:text-teal-300 underline"
        >
          Compare what&apos;s in the free snapshot vs. the full report.
        </button>
      </p>

      {/* Personalized free-vs-paid comparison drawer (AIC-777) */}
      <UpgradeComparisonSheet
        open={upgradeSource !== null}
        onOpenChange={(o) => !o && setUpgradeSource(null)}
        snapshot={snapshot}
        source={upgradeSource ?? "unknown"}
      />
    </main>
  );
}
