"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Copy,
  Check,
  Zap,
  Clock,
  Search,
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
  LinkIcon,
  ClipboardPaste,
  Database,
  ArrowRight,
  Target,
} from "lucide-react";
import Link from "next/link";
import type { LinkedInOptimizeResult } from "@/app/api/linkedin/optimize/route";

type Phase = "input" | "loading" | "results";
type InputTab = "url" | "paste" | "onboarding";

interface ProfileData {
  headline?: string;
  summary?: string;
  experience?: { title: string; company: string; description: string }[];
  skills?: string[];
  education?: { degree: string; field: string; institution: string }[];
  currentTitle?: string;
  currentIndustry?: string;
}

interface IntakeProfile {
  currentTitle?: string;
  currentIndustry?: string;
  skills?: string[];
  transferableSkills?: string[];
  experience?: { title: string; company: string; description: string }[];
  education?: { degree: string; field: string; institution: string }[];
  linkedinUrl?: string;
}

const SECTION_ICONS: Record<string, typeof User> = {
  Headline: Sparkles,
  Summary: User,
  Experience: Briefcase,
  Skills: Target,
  Education: GraduationCap,
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-teal-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
}

function scoreStroke(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#2dd4bf";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-slate-700"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={scoreStroke(score)}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold ${scoreColor(score)}`}>
          {score}
        </span>
        <span className="text-[10px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function highlightChanges(original: string, suggested: string) {
  if (!original || !suggested) return suggested;
  const origWords = new Set(original.toLowerCase().split(/\s+/));
  return suggested.split(/(\s+)/).map((word, i) => {
    if (/^\s+$/.test(word)) return word;
    const isNew = !origWords.has(word.toLowerCase().replace(/[.,;:!?]/g, ""));
    if (isNew) {
      return (
        <span key={i} className="text-emerald-300 font-medium">
          {word}
        </span>
      );
    }
    return word;
  });
}

export default function LinkedInOptimizerClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [inputTab, setInputTab] = useState<InputTab>("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<LinkedInOptimizeResult | null>(null);

  // Paste sections
  const [pasteHeadline, setPasteHeadline] = useState("");
  const [pasteSummary, setPasteSummary] = useState("");
  const [pasteExperience, setPasteExperience] = useState("");
  const [pasteSkills, setPasteSkills] = useState("");

  // Onboarding data
  const [intakeProfile, setIntakeProfile] = useState<IntakeProfile | null>(
    null
  );
  const [intakeLoaded, setIntakeLoaded] = useState(false);
  const [assessmentContext, setAssessmentContext] = useState<{
    transferableCount: number;
    skillCount: number;
    targetRole?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const data = JSON.parse(raw);
        const profile = data.profile ?? data;
        if (profile.skills?.length) {
          setIntakeProfile({
            currentTitle: profile.currentTitle,
            currentIndustry: profile.currentIndustry,
            skills: profile.skills,
            transferableSkills: profile.transferableSkills,
            experience: profile.experience,
            education: profile.education,
            linkedinUrl: profile.linkedinUrl,
          });
          setIntakeLoaded(true);
          setAssessmentContext({
            transferableCount: profile.transferableSkills?.length ?? 0,
            skillCount: profile.skills?.length ?? 0,
            targetRole: data.plans?.[0]?.targetRole,
          });
          if (profile.linkedinUrl) {
            setLinkedinUrl(profile.linkedinUrl);
          }
          if (data.plans?.[0]?.targetRole) {
            setTargetRole(data.plans[0].targetRole);
          }
          if (data.plans?.[0]?.targetIndustry) {
            setTargetIndustry(data.plans[0].targetIndustry);
          }
        }
      }
    } catch {}
  }, []);

  function buildProfileData(): ProfileData | undefined {
    if (inputTab === "paste") {
      return {
        headline: pasteHeadline || undefined,
        summary: pasteSummary || undefined,
        skills: pasteSkills
          ? pasteSkills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        experience: pasteExperience
          ? [{ title: "", company: "", description: pasteExperience }]
          : undefined,
      };
    }
    if (inputTab === "onboarding" && intakeProfile) {
      return {
        currentTitle: intakeProfile.currentTitle,
        currentIndustry: intakeProfile.currentIndustry,
        skills: intakeProfile.skills,
        experience: intakeProfile.experience,
        education: intakeProfile.education,
      };
    }
    return undefined;
  }

  async function optimize() {
    if (!targetRole.trim()) {
      setError("Target role is required.");
      return;
    }

    if (inputTab === "url" && !linkedinUrl.trim()) {
      setError("Please enter a LinkedIn profile URL.");
      return;
    }

    if (inputTab === "paste" && !pasteHeadline && !pasteSummary) {
      setError("Please paste at least your headline or summary.");
      return;
    }

    if (inputTab === "onboarding" && !intakeProfile) {
      setError("No onboarding data found. Complete the career assessment first.");
      return;
    }

    setPhase("loading");
    setError("");

    try {
      const body: Record<string, unknown> = {
        targetRole: targetRole.trim(),
        targetIndustry: targetIndustry.trim() || undefined,
      };

      if (inputTab === "url") {
        body.linkedinUrl = linkedinUrl.trim();
      } else {
        body.profileData = buildProfileData();
      }

      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Optimization failed");
      }

      const data: LinkedInOptimizeResult = await res.json();
      setResult(data);
      setPhase("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setPhase("input");
    }
  }

  // --- Loading Phase ---
  if (phase === "loading") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Optimizing Your Profile</h2>
        <p className="text-slate-400 text-sm">
          Analyzing each section for pivot-readiness and writing targeted
          rewrites...
        </p>
        <div className="mt-8 space-y-3 max-w-xs mx-auto">
          {["Scoring sections", "Writing rewrites", "Finding keywords"].map(
            (step, i) => (
              <div
                key={step}
                className="flex items-center gap-3 text-sm text-slate-400"
              >
                <Loader2
                  className="w-4 h-4 animate-spin text-teal-400"
                  style={{ animationDelay: `${i * 500}ms` }}
                />
                {step}
              </div>
            )
          )}
        </div>
      </main>
    );
  }

  // --- Results Phase ---
  if (phase === "results" && result) {
    const labelDesc: Record<string, string> = {
      "Pivot-Ready":
        "Your profile effectively tells your career pivot story. Minor tweaks will make it even stronger.",
      "Almost There":
        "Strong foundation with a few sections that need better pivot framing to attract recruiters.",
      "Needs Reframing":
        "Your experience is valuable but needs significant reframing to signal your career pivot.",
      "Major Rewrite Needed":
        "Your profile currently reads for your old career. A full rewrite will transform your visibility.",
    };

    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              LinkedIn Optimization Results
            </h1>
            <p className="text-slate-400 text-sm">
              Pivot-optimized for{" "}
              <span className="text-white font-medium">{targetRole}</span>
              {targetIndustry && (
                <>
                  {" "}
                  in{" "}
                  <span className="text-white font-medium">
                    {targetIndustry}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setPhase("input");
              setResult(null);
            }}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            Optimize again →
          </button>
        </div>

        {/* Score Banner */}
        <div className="flex items-center gap-8 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8">
          <ScoreRing score={result.overallScore} size={100} />
          <div className="flex-1">
            <div
              className={`text-2xl font-bold mb-1 ${scoreColor(result.overallScore)}`}
            >
              {result.overallLabel}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-3">
              {labelDesc[result.overallLabel] || result.bridgeStorySummary}
            </p>
            <div className="flex flex-wrap gap-3">
              {result.sectionScores.map((s) => (
                <div key={s.section} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${scoreBg(s.score)}`}
                  />
                  <span className="text-xs text-slate-300">{s.section}</span>
                  <span
                    className={`text-xs font-semibold ${scoreColor(s.score)}`}
                  >
                    {s.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Wins */}
        {result.quickWins.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Wins
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {result.quickWins.slice(0, 3).map((win, i) => (
                <div
                  key={i}
                  className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~5 min
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{win}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Cards */}
        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-bold">Section-by-Section Optimization</h2>
          {result.sectionScores.map((section) => {
            const Icon = SECTION_ICONS[section.section] || Sparkles;
            return (
              <div
                key={section.section}
                className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-teal-400" />
                    <span className="font-semibold text-sm">
                      {section.section}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      section.score >= 80
                        ? "bg-emerald-900/40 text-emerald-400"
                        : section.score >= 60
                          ? "bg-teal-900/40 text-teal-400"
                          : section.score >= 40
                            ? "bg-amber-900/40 text-amber-400"
                            : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {section.score} — {section.scoreLabel}
                  </span>
                </div>

                {/* Before / After */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/40">
                  <div className="p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Current
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                      {section.current || (
                        <span className="italic text-slate-500">
                          No content — this section is empty
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-5 bg-teal-950/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                        Suggested
                      </div>
                      <CopyButton text={section.suggested} />
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {highlightChanges(section.current, section.suggested)}
                    </p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="px-5 py-3 border-t border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Why: </span>
                    {section.reasoning}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Keyword Panel */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            Keyword Intelligence
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Missing Keywords */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, i) => (
                  <div
                    key={i}
                    className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      kw.relevance === "critical"
                        ? "bg-red-950/30 border-red-800/40 text-red-300"
                        : kw.relevance === "important"
                          ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                          : "bg-slate-700/40 border-slate-600/40 text-slate-300"
                    }`}
                  >
                    {kw.keyword}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-xs whitespace-nowrap z-10 shadow-lg">
                      Add to: {kw.whereToAdd}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Search Terms */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-teal-400 mb-3">
                Recruiter Search Terms
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.recruiterSearchTerms.map((term, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-950/30 border border-teal-800/40 text-teal-300"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bridge Story */}
        <section className="mb-10">
          <div className="bg-teal-950/20 border border-teal-900/30 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-teal-300 mb-2">
              Your Bridge Story
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {result.bridgeStorySummary}
            </p>
          </div>
        </section>

        <div className="flex gap-3 justify-center">
          <Link
            href="/gap-analysis"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors"
          >
            Gap Analysis
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // --- Input Phase ---
  const tabs: { key: InputTab; label: string; icon: typeof LinkIcon }[] = [
    { key: "url", label: "LinkedIn URL", icon: LinkIcon },
    { key: "paste", label: "Paste Sections", icon: ClipboardPaste },
    { key: "onboarding", label: "From Onboarding", icon: Database },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          LinkedIn Profile Optimizer
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          Rewrite Your LinkedIn for the Pivot
        </h1>
        <p className="text-slate-400 leading-relaxed max-w-xl mx-auto">
          Get section-by-section rewrites that tell your bridge story, surface
          missing keywords, and match how recruiters actually search.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column — Input */}
        <div className="lg:col-span-3 space-y-6">
          {/* Source Tabs */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Profile Source
            </label>
            <div className="flex rounded-xl bg-slate-800 p-1">
              {tabs.map(({ key, label, icon: TabIcon }) => (
                <button
                  key={key}
                  onClick={() => setInputTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    inputTab === key
                      ? "bg-teal-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* URL Tab */}
          {inputTab === "url" && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                We&apos;ll fetch your profile data via Proxycurl
              </p>
            </div>
          )}

          {/* Paste Tab */}
          {inputTab === "paste" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Headline
                </label>
                <input
                  value={pasteHeadline}
                  onChange={(e) => setPasteHeadline(e.target.value)}
                  placeholder="Your current LinkedIn headline"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  About / Summary
                </label>
                <textarea
                  value={pasteSummary}
                  onChange={(e) => setPasteSummary(e.target.value)}
                  placeholder="Paste your LinkedIn About section"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Experience
                </label>
                <textarea
                  value={pasteExperience}
                  onChange={(e) => setPasteExperience(e.target.value)}
                  placeholder="Paste your experience descriptions"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Skills (comma-separated)
                </label>
                <input
                  value={pasteSkills}
                  onChange={(e) => setPasteSkills(e.target.value)}
                  placeholder="Python, Project Management, Data Analysis"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Onboarding Tab */}
          {inputTab === "onboarding" && (
            <div>
              {intakeLoaded ? (
                <div className="bg-teal-950/20 border border-teal-800/30 rounded-xl p-4 text-sm">
                  <p className="text-teal-300 font-semibold mb-1">
                    Profile loaded from onboarding
                    {intakeProfile?.currentTitle && (
                      <span className="font-normal text-slate-400">
                        {" "}
                        — {intakeProfile.currentTitle}
                      </span>
                    )}
                  </p>
                  <p className="text-slate-400">
                    {intakeProfile?.skills?.length ?? 0} skills,{" "}
                    {intakeProfile?.experience?.length ?? 0} experiences,{" "}
                    {intakeProfile?.education?.length ?? 0} education entries
                  </p>
                </div>
              ) : (
                <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 text-sm">
                  <p className="text-amber-300 font-semibold mb-1">
                    No onboarding data found
                  </p>
                  <p className="text-slate-400">
                    Complete the{" "}
                    <Link
                      href="/onboarding"
                      className="text-teal-400 hover:text-teal-300 underline"
                    >
                      career assessment
                    </Link>{" "}
                    first, then come back here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Target Role + Industry */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                Target Role *
              </label>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Product Manager"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                Target Industry
              </label>
              <input
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g. SaaS / FinTech"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assessment Context Card */}
          {assessmentContext && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                From Your Assessment
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-slate-300">
                    {assessmentContext.skillCount} skills
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">
                    {assessmentContext.transferableCount} transferable
                  </span>
                </div>
                {assessmentContext.targetRole && (
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    <span className="text-slate-300">
                      {assessmentContext.targetRole}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={optimize}
            disabled={!targetRole.trim()}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-lg transition-all shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Optimize My LinkedIn →
          </button>
        </div>

        {/* Right Column — Profile Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-gradient-to-r from-blue-900/60 to-teal-900/40" />

              {/* Avatar + Name */}
              <div className="px-5 -mt-8">
                <div className="w-16 h-16 rounded-full bg-slate-600 border-4 border-slate-800 flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 space-y-3">
                <div>
                  <div className="font-semibold text-white text-sm">
                    {intakeProfile?.currentTitle
                      ? `${intakeProfile.currentTitle}`
                      : "Your Name"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inputTab === "paste" && pasteHeadline
                      ? pasteHeadline
                      : inputTab === "onboarding" && intakeProfile?.currentTitle
                        ? `${intakeProfile.currentTitle}${intakeProfile.currentIndustry ? ` · ${intakeProfile.currentIndustry}` : ""}`
                        : "Your current headline"}
                  </div>
                </div>

                {/* About preview */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    About
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">
                    {inputTab === "paste" && pasteSummary
                      ? pasteSummary
                      : "Your summary will appear here..."}
                  </p>
                </div>

                {/* Experience preview */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Experience
                  </div>
                  {(inputTab === "onboarding"
                    ? intakeProfile?.experience?.slice(0, 2)
                    : []
                  )?.map((exp, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <Briefcase className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-300 font-medium">
                          {exp.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {exp.company}
                        </div>
                      </div>
                    </div>
                  )) ?? (
                    <p className="text-xs text-slate-500 italic">
                      Experience entries will appear here
                    </p>
                  )}
                </div>

                {/* Skills preview */}
                {((inputTab === "paste" && pasteSkills) ||
                  (inputTab === "onboarding" && intakeProfile?.skills)) && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(inputTab === "paste"
                        ? pasteSkills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : intakeProfile?.skills ?? []
                      )
                        .slice(0, 6)
                        .map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-700/60 text-slate-400"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-xs text-teal-400">
                    <ChevronRight className="w-3 h-3" />
                    Pivot target: {targetRole || "Not set"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
