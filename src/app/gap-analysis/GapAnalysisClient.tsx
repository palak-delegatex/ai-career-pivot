"use client";

import { useState, useEffect } from "react";
import NextStepCTA from "@/components/NextStepCTA";
import LearningResources from "@/components/LearningResources";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  BookOpen,
  Target,
  Lightbulb,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface MatchedSkill {
  skill: string;
  evidence: string;
  strength: "strong" | "moderate" | "basic";
}

interface MissingSkill {
  skill: string;
  importance: "must-have" | "nice-to-have";
  actionStep: string;
  timeToAcquire: string;
  recommendedResource: string;
}

interface ExperienceGap {
  area: string;
  gap: string;
  suggestion: string;
}

interface GapAnalysisResult {
  overallFitScore: number;
  fitLabel: string;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  experienceGaps: ExperienceGap[];
  careerPivotFit: {
    summary: string;
    transferableHighlights: string[];
    biggestChallenges: string[];
    estimatedReadinessTimeline: string;
  };
  applicationTips: string[];
}

type Phase = "input" | "loading" | "results";

const STRENGTH_COLORS = {
  strong: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40",
  moderate: "text-amber-400 bg-amber-900/30 border-amber-700/40",
  basic: "text-blue-400 bg-blue-900/30 border-blue-700/40",
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-red-400";
  const strokeColor =
    score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${color}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export default function GapAnalysisClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [error, setError] = useState("");

  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [transferableSkills, setTransferableSkills] = useState<string[]>([]);
  const [userExperience, setUserExperience] = useState<
    { title: string; company: string; description: string }[]
  >([]);
  const [userEducation, setUserEducation] = useState<
    { degree: string; field: string; institution: string }[]
  >([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const data = JSON.parse(raw);
        const profile = data.profile ?? data;
        if (profile.skills?.length) {
          setUserSkills(profile.skills);
          setCurrentTitle(profile.currentTitle ?? "");
          setTransferableSkills(profile.transferableSkills ?? []);
          setUserExperience(
            (profile.experience ?? []).map(
              (e: { title: string; company: string; description: string }) => ({
                title: e.title,
                company: e.company,
                description: e.description,
              })
            )
          );
          setUserEducation(
            (profile.education ?? []).map(
              (e: { degree: string; field: string; institution: string }) => ({
                degree: e.degree,
                field: e.field,
                institution: e.institution,
              })
            )
          );
          setProfileLoaded(true);
        }
      }
    } catch {}
  }, []);

  async function analyze() {
    if (!jobDescription.trim()) return;
    if (!userSkills.length) {
      setError(
        "No profile found. Complete the career assessment first to load your skills."
      );
      return;
    }

    setPhase("loading");
    setError("");

    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          userSkills,
          currentTitle,
          transferableSkills,
          userExperience,
          userEducation,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: GapAnalysisResult = await res.json();
      setResult(data);
      setPhase("results");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("input");
    }
  }

  if (phase === "loading") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Analyzing Job Fit</h2>
        <p className="text-slate-400 text-sm">
          Comparing your skills against the job requirements...
        </p>
      </main>
    );
  }

  if (phase === "results" && result) {
    const mustHaves = result.missingSkills.filter(
      (s) => s.importance === "must-have"
    );
    const niceToHaves = result.missingSkills.filter(
      (s) => s.importance === "nice-to-have"
    );

    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              Gap Analysis Results
            </h1>
            <p className="text-slate-400 text-sm">
              Based on your profile vs. the job posting
            </p>
          </div>
          <button
            onClick={() => {
              setPhase("input");
              setResult(null);
            }}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            Analyze another job →
          </button>
        </div>

        {/* Score + Fit Label */}
        <div className="flex items-center gap-8 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8">
          <ScoreRing score={result.overallFitScore} />
          <div>
            <div className="text-2xl font-bold mb-1">{result.fitLabel}</div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {result.careerPivotFit.summary}
            </p>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-teal-400" />
              Estimated readiness:{" "}
              {result.careerPivotFit.estimatedReadinessTimeline}
            </div>
          </div>
        </div>

        {/* Matched Skills */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Matched Skills ({result.matchedSkills.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.matchedSkills.map((s, i) => (
              <div
                key={i}
                className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{s.skill}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STRENGTH_COLORS[s.strength]}`}
                  >
                    {s.strength}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{s.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Missing Skills — Must Haves */}
        {mustHaves.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Must-Have Gaps ({mustHaves.length})
            </h2>
            <div className="space-y-3">
              {mustHaves.map((s, i) => (
                <div
                  key={i}
                  className="bg-red-950/20 border border-red-900/30 rounded-xl p-4"
                >
                  <div className="font-semibold text-sm mb-2">{s.skill}</div>
                  <div className="flex items-start gap-2 mb-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-300">{s.actionStep}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.timeToAcquire}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {s.recommendedResource}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Missing Skills — Nice to Haves */}
        {niceToHaves.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Nice-to-Have Gaps ({niceToHaves.length})
            </h2>
            <div className="space-y-3">
              {niceToHaves.map((s, i) => (
                <div
                  key={i}
                  className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4"
                >
                  <div className="font-semibold text-sm mb-2">{s.skill}</div>
                  <div className="flex items-start gap-2 mb-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-300">{s.actionStep}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.timeToAcquire}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {s.recommendedResource}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Learning Resources */}
        {result.missingSkills.length > 0 && (
          <LearningResources
            skillGaps={result.missingSkills.map((s) => ({
              skill: s.skill,
              currentLevel: "none",
              requiredLevel: s.importance === "must-have" ? "proficient" : "familiar",
              priority: s.importance === "must-have" ? "high" : "medium",
            }))}
            targetRole={result.careerPivotFit?.summary}
          />
        )}

        {/* Experience Gaps */}
        {result.experienceGaps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Experience Gaps
            </h2>
            <div className="space-y-3">
              {result.experienceGaps.map((g, i) => (
                <div
                  key={i}
                  className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4"
                >
                  <div className="font-semibold text-sm mb-1">{g.area}</div>
                  <p className="text-xs text-slate-400 mb-2">{g.gap}</p>
                  <p className="text-xs text-teal-300">{g.suggestion}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pivot Fit */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-teal-400" />
            Career Pivot Assessment
          </h2>
          <div className="bg-teal-950/20 border border-teal-900/30 rounded-2xl p-5 space-y-4">
            {result.careerPivotFit.transferableHighlights.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-emerald-400 mb-2">
                  Transferable Strengths
                </div>
                <ul className="space-y-1">
                  {result.careerPivotFit.transferableHighlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.careerPivotFit.biggestChallenges.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-amber-400 mb-2">
                  Biggest Challenges
                </div>
                <ul className="space-y-1">
                  {result.careerPivotFit.biggestChallenges.map((c, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Application Tips */}
        {result.applicationTips.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4">Application Tips</h2>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <ol className="space-y-2">
                {result.applicationTips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-300 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600/30 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <NextStepCTA fromTool="gap-analysis" />

        <div className="flex justify-center mt-4">
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

  // Input phase
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          <Search className="w-3.5 h-3.5" />
          Job-Specific Gap Analysis
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          How Well Do You Fit?
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Paste any job posting and we&apos;ll show exactly which skills you
          match, which you&apos;re missing, and how to close every gap.
        </p>
      </div>

      {!profileLoaded && (
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-6 text-sm">
          <p className="text-amber-300 font-semibold mb-1">
            Profile not loaded
          </p>
          <p className="text-slate-400">
            Complete the{" "}
            <Link
              href="/onboarding"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              career assessment
            </Link>{" "}
            first so we can compare your skills against the job.
          </p>
        </div>
      )}

      {profileLoaded && (
        <div className="bg-teal-950/20 border border-teal-800/30 rounded-xl p-4 mb-6 text-sm">
          <p className="text-teal-300 font-semibold mb-1">
            Profile loaded
            {currentTitle && (
              <span className="font-normal text-slate-400">
                {" "}
                — {currentTitle}
              </span>
            )}
          </p>
          <p className="text-slate-400">
            {userSkills.length} skills loaded. Ready to analyze.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job posting here — title, requirements, qualifications, responsibilities..."
          rows={10}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={analyze}
          disabled={!jobDescription.trim() || !profileLoaded}
          className="w-full px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze My Fit →
        </button>

        <p className="text-slate-500 text-xs text-center">
          AI-powered analysis takes ~10 seconds
        </p>
      </div>
    </main>
  );
}
