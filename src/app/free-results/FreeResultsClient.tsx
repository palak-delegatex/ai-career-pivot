"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Share2, Check, Briefcase, TrendingUp, DollarSign, Users, Award, Target, Link as LinkIcon } from "lucide-react";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import { testimonials } from "@/lib/testimonials";
import SocialProofStrip from "@/components/SocialProofStrip";

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

function GatedSection({ label, variant }: { label: string; variant: "milestones" | "financial" | "coaching" }) {
  const variantContent: Record<string, { lines: string[]; icon: string }> = {
    milestones: {
      lines: ["Month 1-2: Complete foundational cert...", "Month 3-4: Build portfolio project in...", "Month 6: Apply to target roles with..."],
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    financial: {
      lines: ["Current salary: $XXX,XXX → Target: $XX...", "Bridge budget: $X,XXX over 6 months", "ROI breakeven: month 4 of new role"],
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    coaching: {
      lines: ["Week 1: Skill gap assessment & plan...", "Weekly AI coaching: personalized feed...", "Action items auto-generated from your..."],
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
  };

  const content = variantContent[variant];

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-sm select-none pointer-events-none">
        <div className="space-y-2 p-4 bg-slate-800/40 rounded-xl">
          {content.lines.map((line, i) => (
            <div key={i} className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={content.icon} />
              </svg>
              <span className="text-xs text-slate-500 truncate">{line}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-[1px] rounded-xl gap-2">
        <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs text-slate-300 font-medium">{label} — Unlock for $19</span>
      </div>
    </div>
  );
}

function SalaryInsightTeaser({ uplift }: { uplift: number }) {
  return (
    <Link
      href="/pricing"
      className="block rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-800/30 p-4 hover:border-emerald-700/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-900/50 border border-emerald-700/40 shrink-0">
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            Estimated +${uplift}K salary uplift
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Based on market data for your target role. Full salary trajectory in report →
          </p>
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
      </div>
    </Link>
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
  const [selectedPath, setSelectedPath] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jobCount, setJobCount] = useState(0);

  const topPath = snapshot?.paths[0];
  const shareText = topPath
    ? `I'm a ${topPath.matchScore}% match for ${topPath.targetRole}! See where your career could go:`
    : "See where your career could go:";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/free` : "https://aicareerpivot.com/free";

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

  const activePath = snapshot.paths[selectedPath];
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
        <h1 className="text-3xl font-extrabold mb-2">Your Career Pivot Matches</h1>
        {snapshot.profileSummary && (
          <p className="text-slate-400 text-sm">{snapshot.profileSummary}</p>
        )}
      </div>

      {/* Share buttons */}
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

      {/* Path selector tabs */}
      {snapshot.paths.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {snapshot.paths.map((path, i) => (
            <button
              key={i}
              onClick={() => setSelectedPath(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                i === selectedPath
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {path.targetRole}
            </button>
          ))}
        </div>
      )}

      {/* Active path card */}
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

          {/* Job teaser */}
          <JobTeaser targetRole={activePath.targetRole} jobCount={jobCount} />

          {/* Salary insight teaser */}
          <div className="mt-3">
            <SalaryInsightTeaser uplift={salaryUplift} />
          </div>

          {/* Gated sections */}
          <div className="space-y-3 mt-4">
            <GatedSection label="6-month / 1-year / 2-year milestones" variant="milestones" />
            <GatedSection label="Financial bridge — salary trajectory & ROI" variant="financial" />
            <GatedSection label="AI coaching + weekly action plan" variant="coaching" />
          </div>
        </div>
      )}

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
          <Link
            href="/pricing"
            className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/30"
          >
            Get Full Report — $19 →
          </Link>
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

      {/* Bottom nudge */}
      <p className="text-center text-slate-500 text-xs mt-6">
        Seeing a path you like?{" "}
        <Link href="/pricing" className="text-teal-400 hover:text-teal-300 underline">
          Get the complete plan with milestones, salary data, and AI coaching for $19.
        </Link>
      </p>
    </main>
  );
}
