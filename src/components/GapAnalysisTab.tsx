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
  ExternalLink,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { UserProfile, PivotPlan, CourseResource, GapLearningRoadmapPhase } from "@/lib/intake";
import ResumeGeneratorSheet from "@/components/ResumeGeneratorSheet";
import UpgradePrompt from "@/components/UpgradePrompt";
import { trackGateHit, trackFreeFeatureUsed } from "@/lib/tracking";

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
  recommendedResources: CourseResource[];
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
  totalMissingSkills?: number;
  experienceGaps: ExperienceGap[];
  totalExperienceGaps?: number;
  weeklyActionPlan: WeeklyAction[];
  learningRoadmap: GapLearningRoadmapPhase[];
  applicationTips: string[];
  _freeTier?: boolean;
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

const costLabel: Record<string, string> = {
  free: "Free",
  low: "< $50",
  medium: "$50-200",
  high: "$200+",
};

const credentialIcon: Record<string, string> = {
  high: "Industry Cert",
  medium: "Certificate",
  low: "Badge",
  none: "Self-study",
};

function CourseResourceCard({ resource }: { resource: CourseResource }) {
  const typeIcon = {
    course: BookOpen,
    certification: GraduationCap,
    tutorial: Sparkles,
    book: BookOpen,
    youtube: ExternalLink,
    practice: Target,
  };
  const Icon = typeIcon[resource.type] || BookOpen;

  return (
    <div className="flex items-start gap-3 p-2.5 bg-slate-900/40 rounded-lg group">
      <Icon className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-slate-200 truncate">
            {resource.name}
          </p>
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3 text-slate-500 hover:text-teal-400" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
          <span>{resource.provider}</span>
          <span>&middot;</span>
          <span>{resource.duration}</span>
          <span>&middot;</span>
          <span>{costLabel[resource.cost] ?? resource.cost}</span>
          {resource.credentialValue !== "none" && (
            <>
              <span>&middot;</span>
              <span className="text-amber-400 flex items-center gap-0.5">
                <Award className="h-2.5 w-2.5" />
                {credentialIcon[resource.credentialValue]}
              </span>
            </>
          )}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">{resource.reason}</p>
      </div>
    </div>
  );
}

function RoadmapPhaseCard({ phase }: { phase: GapLearningRoadmapPhase }) {
  const phaseConfig = {
    foundation: {
      color: "text-emerald-400",
      bg: "bg-emerald-900/20",
      border: "border-emerald-700/30",
      dot: "bg-emerald-500",
    },
    "core-skills": {
      color: "text-teal-400",
      bg: "bg-teal-900/20",
      border: "border-teal-700/30",
      dot: "bg-teal-500",
    },
    advanced: {
      color: "text-violet-400",
      bg: "bg-violet-900/20",
      border: "border-violet-700/30",
      dot: "bg-violet-500",
    },
  };
  const config = phaseConfig[phase.phase];

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h4 className={`text-sm font-semibold ${config.color}`}>
            {phase.title}
          </h4>
        </div>
        <span className="text-[10px] text-slate-500">{phase.weeks}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {phase.skills.map((skill) => (
          <span
            key={skill}
            className="px-2 py-1 text-[10px] bg-slate-800/60 border border-slate-700 rounded-md text-slate-300"
          >
            {skill}
          </span>
        ))}
      </div>

      {phase.resources.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {phase.resources.map((resource, i) => (
            <CourseResourceCard key={i} resource={resource} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 pt-2 border-t border-slate-700/40">
        <Target className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-300">
          <span className="font-medium text-teal-300">Milestone:</span>{" "}
          {phase.milestone}
        </p>
      </div>
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

      if (res.status === 401 || res.status === 402) {
        const data = await res.json().catch(() => ({}));
        trackGateHit({ feature: "gap_analysis", plan: "free", gate_type: res.status === 402 ? "limit_reached" : "blocked" });
        throw new Error(data.error || "Upgrade required to use this feature");
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data: GapAnalysisResult = await res.json();
      setResult(data);
      if (data._freeTier) {
        trackFreeFeatureUsed({ feature: "gap_analysis", usage_count: 1, limit: 1 });
      }
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
              defaultValue={["matched", "gaps", "learning-roadmap", "action-plan"]}
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

              {/* Free tier banner */}
              {result._freeTier && (
                <div className="mb-4 bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
                  <p className="text-sm text-amber-200 font-medium mb-1">
                    Free preview — showing top {result.missingSkills.length} of {result.totalMissingSkills ?? result.missingSkills.length} gaps
                  </p>
                  <p className="text-xs text-amber-300/60">
                    Upgrade to see all gaps, learning roadmaps with curated courses, and weekly action plans.
                  </p>
                </div>
              )}

              {/* Skill Gaps */}
              <AccordionItem value="gaps">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Skill Gaps
                  </span>
                  <Badge className="ml-auto mr-2 bg-red-900/30 border-red-700/30 text-red-300 text-[10px]">
                    {result.totalMissingSkills ?? result.missingSkills.length}
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
                              {s.recommendedResources?.length > 0 && (
                                <div className="space-y-1.5 mt-2 pt-2 border-t border-red-800/20">
                                  {s.recommendedResources.map((r, ri) => (
                                    <CourseResourceCard key={ri} resource={r} />
                                  ))}
                                </div>
                              )}
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
                              {s.recommendedResources?.length > 0 && (
                                <div className="space-y-1.5 mt-2 pt-2 border-t border-amber-800/20">
                                  {s.recommendedResources.map((r, ri) => (
                                    <CourseResourceCard key={ri} resource={r} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

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

              {/* Free tier upgrade CTA */}
              {result._freeTier && (
                <div className="py-4">
                  <UpgradePrompt
                    feature="gap analysis"
                    message={`You're seeing ${result.missingSkills.length} of ${result.totalMissingSkills ?? result.missingSkills.length} skill gaps. Upgrade for the full analysis with learning roadmaps, curated courses, and weekly action plans.`}
                    location="gap_analysis_results"
                  />
                </div>
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

              {/* Learning Roadmap */}
              {result.learningRoadmap?.length > 0 && (
                <AccordionItem value="learning-roadmap">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-teal-400" />
                      12-Week Learning Roadmap
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[10px] text-slate-500 mb-3">
                      A structured plan to close your skill gaps and become
                      job-ready
                    </p>
                    <div className="space-y-3">
                      {result.learningRoadmap.map((phase, i) => (
                        <RoadmapPhaseCard key={i} phase={phase} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

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
