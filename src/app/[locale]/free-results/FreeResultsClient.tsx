"use client";

import { useEffect, useState, useCallback, type ReactNode, type ComponentType } from "react";
import Link from "next/link";
import { Check, Briefcase, TrendingUp, DollarSign, Users, Award, Target, Link as LinkIcon, Lock, Layers, CalendarClock, LineChart, Mail } from "lucide-react";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import type { UserProfile } from "@/lib/intake";
import { testimonials } from "@/lib/testimonials";
import SocialProofStrip from "@/components/SocialProofStrip";
import UpgradeComparisonSheet from "@/components/UpgradeComparisonSheet";
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
 * Contextual upgrade prompt (AIC-618 D2). Placed inline WHERE the gated content
 * would appear, showing a blurred preview of the real data type underneath a
 * lock overlay + inline CTA. Loss aversion: users see the value exists but
 * cannot read it, so the upgrade closes a concrete, visible gap.
 */
function ContextualUpgradePrompt({
  title,
  hook,
  icon: Icon,
  children,
  onUnlock,
}: {
  title: string;
  hook: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Opens the free-vs-paid comparison sheet (AIC-777) instead of leaving for /pricing. */
  onUnlock: () => void;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
      <div className="blur-[5px] select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-slate-900/60 backdrop-blur-[1px] gap-1.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-600/20 border border-teal-600/40">
          <Icon className="w-4 h-4 text-teal-300" />
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-300 max-w-xs">{hook}</p>
        <button
          type="button"
          onClick={onUnlock}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors shadow-lg shadow-teal-900/30"
        >
          <Lock className="w-3.5 h-3.5" />
          Unlock for $19
        </button>
      </div>
    </div>
  );
}

/** Blurred preview: the other matched paths as ghost cards (D2 prompt #1). */
function GhostPathCards({ paths }: { paths: { targetRole: string; matchScore: number }[] }) {
  return (
    <div className="space-y-2 p-4 bg-slate-800/40">
      {paths.map((p, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-700/40 border border-slate-600/40 p-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-900/40 border border-teal-700/30 text-xs font-bold text-teal-300 shrink-0">
            {p.matchScore}
          </div>
          <span className="text-sm font-semibold text-slate-200">{p.targetRole}</span>
        </div>
      ))}
    </div>
  );
}

/** Blurred preview: 3-phase milestone timeline (D2 prompt #2). */
function GhostMilestoneTimeline() {
  const phases = [
    { label: "6 months", body: "Foundational certification + first portfolio project" },
    { label: "1 year", body: "Land transitional role, ship shippable AI work" },
    { label: "2 years", body: "Full pivot complete at target comp band" },
  ];
  return (
    <div className="p-4 bg-slate-800/40 space-y-3">
      {phases.map((ph) => (
        <div key={ph.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <div className="w-px flex-1 bg-slate-600 mt-1 min-h-[18px]" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-300">{ph.label}</p>
            <p className="text-xs text-slate-300">{ph.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Blurred preview: salary trajectory current → target (D2 prompt #3). */
function GhostSalaryTrajectory({ uplift }: { uplift: number }) {
  return (
    <div className="p-4 bg-slate-800/40">
      <div className="flex items-center justify-between gap-3">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Current</p>
          <p className="text-lg font-bold text-slate-300">$XXX,XXX</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs font-bold text-emerald-400">+${uplift}K</span>
          <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-slate-600 to-emerald-500 mt-1" />
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Target</p>
          <p className="text-lg font-bold text-emerald-300">$XXX,XXX</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">Bridge budget + ROI breakeven timeline included</p>
    </div>
  );
}

function ReportCounterBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-400">
      <Users className="w-3 h-3 text-teal-400" />
      <span><strong className="text-slate-300">547</strong> reports generated this week</span>
    </div>
  );
}

function ValuePropCallout() {
  const props = [
    { icon: Target, text: "Personalized to your exact background" },
    { icon: Award, text: "Actionable milestones, not generic advice" },
    { icon: DollarSign, text: "Salary data & financial bridge plan" },
  ];
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mt-4">
      {props.map((p) => (
        <div key={p.text} className="flex items-center gap-1.5 text-xs text-slate-400">
          <p.icon className="w-3.5 h-3.5 text-teal-400" />
          <span>{p.text}</span>
        </div>
      ))}
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
  const otherPaths = snapshot.paths.slice(1).map((p) => ({ targetRole: p.targetRole, matchScore: p.matchScore }));
  const salaryUplift = snapshot.estimatedSalaryUplift ?? 15;
  const marcusTestimonial = testimonials.find((t) => t.name === "Marcus T.")!;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold">
            Free Skill-Gap Snapshot
          </div>
          <ReportCounterBadge />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Your Top Career Pivot Match</h1>
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
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-4">Hidden Strengths You Didn&apos;t Know You Had</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Top Skill Gaps to Close
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

          {/* Contextual prompt #2 — milestone roadmap, placed right after the gaps
              the user now wants to close (progressive disclosure). */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Your Milestone Roadmap
            </p>
            <ContextualUpgradePrompt
              title="Your personalized milestone roadmap"
              hook="The step-by-step plan to close these gaps — 6-month, 1-year & 2-year milestones."
              icon={CalendarClock}
              onUnlock={() => openUpgrade("prompt_roadmap")}
            >
              <GhostMilestoneTimeline />
            </ContextualUpgradePrompt>
          </div>

          {/* Job teaser */}
          <JobTeaser targetRole={activePath.targetRole} jobCount={jobCount} />
        </div>
      )}

      {/* Share buttons — placed after the "aha" moment so users share with conviction */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
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

      {/* Contextual prompt #1 — the other matched paths as blurred ghost cards
          (loss aversion: they exist, but you can't read them). */}
      {otherPaths.length > 0 && (
        <div className="mb-6">
          <ContextualUpgradePrompt
            title={`${otherPaths.length} more career path${otherPaths.length > 1 ? "s" : ""} matched to you`}
            hook="You have additional strong-fit pivots. Unlock to compare every match side by side."
            icon={Layers}
            onUnlock={() => openUpgrade("prompt_paths")}
          >
            <GhostPathCards paths={otherPaths} />
          </ContextualUpgradePrompt>
        </div>
      )}

      {/* Contextual prompt #3 — salary trajectory, placed last (anchoring on the
          partially visible numbers). */}
      <div className="mb-6">
        <ContextualUpgradePrompt
          title="Salary trajectory & financial bridge plan"
          hook={`Estimated +$${salaryUplift}K uplift. See the full current → target model, bridge budget & ROI breakeven.`}
          icon={LineChart}
          onUnlock={() => openUpgrade("prompt_salary")}
        >
          <GhostSalaryTrajectory uplift={salaryUplift} />
        </ContextualUpgradePrompt>
      </div>

      {/* Upsell CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-900/40 to-slate-800/60 border border-teal-700/40 p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Your Full Roadmap Is Ready</h3>
        <p className="text-slate-400 text-sm mb-3 leading-relaxed">
          We&apos;ve already built your personalized plan. Here&apos;s what&apos;s inside:
        </p>
        <ul className="text-left max-w-sm mx-auto space-y-2 mb-4">
          {[
            "6 / 12 / 24-month milestone timeline",
            "AI certifications roadmap for your target role",
            "Financial modeling — salary trajectory & bridge budget",
            "Week-by-week action plan with AI coaching",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => openUpgrade("cta_full_report")}
            className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/30"
          >
            Get Full Report — $19 →
          </button>
          <Link
            href="/free"
            className="px-6 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm transition-colors"
          >
            Try a different resume
          </Link>
        </div>
        <p className="text-slate-500 text-xs mt-3">One-time payment. 30-day money-back guarantee.</p>
        <ValuePropCallout />
      </div>

      {/* Deferred email capture (D1) — offered after the user has seen value */}
      <div className="mt-6">
        <EmailCaptureCard snapshot={snapshot} profile={profile} />
      </div>

      {/* Social proof strip */}
      <div className="mt-6">
        <SocialProofStrip
          testimonial={marcusTestimonial}
          metrics={[
            { value: "500+", label: "Pivots" },
            { value: "92%", label: "Progress" },
            { value: "$15K+", label: "Avg uplift" },
          ]}
        />
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
