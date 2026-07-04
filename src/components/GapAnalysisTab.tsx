"use client";

import { useState, useEffect } from "react";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Clock,
  Lightbulb,
  ChevronRight,
  Loader2,
  FileText,
  FileSignature,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { UserProfile, PivotPlan } from "@/lib/intake";
import ResumeGeneratorSheet from "@/components/ResumeGeneratorSheet";
import LearningResources from "@/components/LearningResources";

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

interface WeeklyAction {
  week: number;
  focus: string;
  tasks: string[];
  hoursPerWeek: number;
}

interface GapAnalysisResult {
  overallFitScore: number;
  fitLabel: string;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  experienceGaps: ExperienceGap[];
  weeklyActionPlan: WeeklyAction[];
  applicationTips: string[];
}

interface GapAnalysisTabProps {
  profile: UserProfile;
  plan: PivotPlan;
}

function ScoreRing({ score, animated }: { score: number; animated: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (circumference * (animated ? score : 0)) / 100;

  const strokeColor =
    score >= 80
      ? "stroke-emerald-400"
      : score >= 60
        ? "stroke-teal-400"
        : score >= 40
          ? "stroke-amber-400"
          : "stroke-red-400";

  const textColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-teal-400"
        : score >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-slate-700"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold ${textColor}`}>
          {animated ? score : 0}%
        </span>
        <span className="text-xs text-slate-400 mt-0.5">Job Fit</span>
      </div>
    </div>
  );
}

function StrengthBar({ strength }: { strength: "strong" | "moderate" | "basic" }) {
  const widths = { strong: "100%", moderate: "66%", basic: "33%" };
  const colors = {
    strong: "bg-emerald-500",
    moderate: "bg-teal-500",
    basic: "bg-slate-500",
  };
  return (
    <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colors[strength]} transition-all duration-500`}
        style={{ width: widths[strength] }}
      />
    </div>
  );
}

export default function GapAnalysisTab({ profile, plan }: GapAnalysisTabProps) {
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  async function handleAnalyze() {
    if (jobDesc.length < 50) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setAnimated(false);

    try {
      const res = await fetch("/api/intake/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDesc,
          profile: {
            currentTitle: profile.currentTitle,
            currentIndustry: profile.currentIndustry,
            yearsExperience: profile.yearsExperience,
            skills: profile.skills,
            transferableSkills: profile.transferableSkills,
            experience: profile.experience,
            education: profile.education,
            certifications: profile.certifications,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data: GapAnalysisResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setResult(null);
    setAnimated(false);
    setError(null);
  }

  const mustHaveGaps =
    result?.missingSkills.filter((s) => s.importance === "must-have") ?? [];
  const niceToHaveGaps =
    result?.missingSkills.filter((s) => s.importance === "nice-to-have") ?? [];

  return (
    <div className="space-y-6">
      {/* Input */}
      {!result && !analyzing && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-teal-400" />
            <h3 className="text-sm font-bold text-teal-400">
              Job Fit Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Paste a job description below to see how well your profile matches
            and get a personalized action plan to close any gaps.
          </p>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the full job description here (minimum 50 characters)..."
            rows={5}
            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-[10px] ${jobDesc.length >= 50 ? "text-emerald-400" : "text-slate-500"}`}
            >
              {jobDesc.length}/50 min characters
            </span>
            <button
              onClick={handleAnalyze}
              disabled={jobDesc.length < 50}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Analyze Fit
            </button>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {analyzing && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center">
          <Loader2 className="h-10 w-10 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-300 font-medium">
            Analyzing your fit...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            This takes about 10-15 seconds
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={handleAnalyze}
            className="text-xs text-teal-400 hover:text-teal-300 mt-3 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Score + Header */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center">
            <ScoreRing score={result.overallFitScore} animated={animated} />
            <p className="text-lg font-bold text-white mt-3">
              {result.fitLabel}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {result.matchedSkills.length} skills matched &middot;{" "}
              {result.missingSkills.length} gaps found
            </p>

            {/* CTA buttons */}
            <div className="flex gap-3 justify-center mt-5">
              <ResumeGeneratorSheet plan={plan} profile={profile}>
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Resume
                </button>
              </ResumeGeneratorSheet>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium rounded-lg transition-colors"
              >
                Analyze Another
              </button>
            </div>
          </div>

          {/* Detailed results */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <Accordion
              type="multiple"
              defaultValue={["matched", "gaps", "action-plan"]}
            >
              {/* Matched Skills */}
              <AccordionItem value="matched">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Matched Skills
                  </span>
                  <Badge className="ml-auto mr-2 bg-emerald-900/30 border-emerald-700/30 text-emerald-300 text-[10px]">
                    {result.matchedSkills.length}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {result.matchedSkills.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-300">
                            {s.skill}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {s.evidence}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 capitalize">
                            {s.strength}
                          </span>
                          <StrengthBar strength={s.strength} />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Skill Gaps */}
              <AccordionItem value="gaps">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Skill Gaps
                  </span>
                  <Badge className="ml-auto mr-2 bg-red-900/30 border-red-700/30 text-red-300 text-[10px]">
                    {result.missingSkills.length}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {mustHaveGaps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">
                          Must-Have
                        </p>
                        <div className="space-y-3">
                          {mustHaveGaps.map((s, i) => (
                            <div
                              key={i}
                              className="bg-red-900/10 border border-red-800/30 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-red-300">
                                  {s.skill}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {s.timeToAcquire}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {s.actionStep}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-300/80">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span>{s.recommendedResource}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {niceToHaveGaps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                          Nice-to-Have
                        </p>
                        <div className="space-y-3">
                          {niceToHaveGaps.map((s, i) => (
                            <div
                              key={i}
                              className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-amber-300">
                                  {s.skill}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {s.timeToAcquire}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {s.actionStep}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-300/80">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span>{s.recommendedResource}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Learning Resources */}
              {result.missingSkills.length > 0 && (
                <AccordionItem value="learning-resources">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-400" />
                      Learning Resources
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <LearningResources
                      skillGaps={result.missingSkills.map((s) => ({
                        skill: s.skill,
                        currentLevel: "none",
                        requiredLevel: s.importance === "must-have" ? "proficient" : "familiar",
                        priority: s.importance === "must-have" ? "high" : "medium",
                      }))}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Experience Gaps */}
              {result.experienceGaps.length > 0 && (
                <AccordionItem value="experience-gaps">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      Experience Gaps
                    </span>
                    <Badge className="ml-auto mr-2 bg-amber-900/30 border-amber-700/30 text-amber-300 text-[10px]">
                      {result.experienceGaps.length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {result.experienceGaps.map((g, i) => (
                        <div
                          key={i}
                          className="border border-slate-700/60 rounded-lg p-3"
                        >
                          <p className="text-sm font-medium text-white">
                            {g.area}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{g.gap}</p>
                          <p className="text-xs text-teal-300/80 mt-1.5 flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                            {g.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Weekly Action Plan */}
              <AccordionItem value="action-plan">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-400" />
                    Weekly Action Plan
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {result.weeklyActionPlan.map((week) => (
                      <div
                        key={week.week}
                        className="bg-slate-900/40 border border-slate-700/60 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-teal-300">
                            Week {week.week}: {week.focus}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            ~{week.hoursPerWeek}h/week
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {week.tasks.map((task, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-400 flex items-start gap-2"
                            >
                              <span className="text-teal-500 mt-0.5 shrink-0">
                                &bull;
                              </span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Application Tips */}
              {result.applicationTips.length > 0 && (
                <AccordionItem value="tips">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-cyan-400" />
                      Application Tips
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {result.applicationTips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 flex items-start gap-2 p-2 bg-slate-900/30 rounded-lg"
                        >
                          <span className="text-cyan-400 font-bold shrink-0">
                            {i + 1}.
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}
