"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Clock,
  FileText,
  FileSignature,
  ChevronRight,
  Lightbulb,
  Loader2,
  Wand2,
  ExternalLink,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import type { EnrichedJob } from "@/lib/job-match";
import type { UserProfile, PivotPlan, CourseResource, GapLearningRoadmapPhase } from "@/lib/intake";
import { ScoreRing } from "@/components/ScoreRing";
import UpgradePrompt from "@/components/UpgradePrompt";
import ContextualGate from "@/components/ContextualGate";

const FREE_PREVIEW_GAPS = 3;

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
  experienceGaps: ExperienceGap[];
  weeklyActionPlan: WeeklyAction[];
  learningRoadmap: GapLearningRoadmapPhase[];
  applicationTips: string[];
}

interface GapAnalysisSheetProps {
  job?: EnrichedJob | null;
  jobDescription?: string;
  profile: UserProfile;
  plan: PivotPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenResume?: () => void;
  onOpenCoverLetter?: () => void;
  onOpenTailor?: () => void;
  isFreeTier?: boolean;
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

export default function GapAnalysisSheet({
  job,
  jobDescription: externalJD,
  profile,
  plan,
  open,
  onOpenChange,
  onOpenResume,
  onOpenCoverLetter,
  onOpenTailor,
  isFreeTier = false,
}: GapAnalysisSheetProps) {
  const isMobile = useIsMobile();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState<{ message: string; url: string } | null>(null);
  const [animated, setAnimated] = useState(false);
  const [jobDescInput, setJobDescInput] = useState("");

  const jobDesc =
    externalJD ||
    (job
      ? [
          job.title,
          job.company_name,
          job.description_snippet,
          job.tags?.join(", "),
          job.salary,
          job.location,
          job.job_type,
        ]
          .filter(Boolean)
          .join("\n")
      : "");

  useEffect(() => {
    if (!open) {
      setResult(null);
      setError(null);
      setUpgradeNeeded(null);
      setAnimated(false);
      setJobDescInput("");
    }
  }, [open]);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  async function handleAnalyze() {
    const desc = jobDesc || jobDescInput;
    if (desc.length < 50) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/intake/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: desc,
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
        setUpgradeNeeded({
          message: data.error ?? "Upgrade required",
          url: data.upgradeUrl ?? "/pricing",
        });
        setAnalyzing(false);
        return;
      }

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

  const allGaps = result?.missingSkills ?? [];
  const visibleGaps = isFreeTier ? allGaps.slice(0, FREE_PREVIEW_GAPS) : allGaps;
  const hiddenGapCount = isFreeTier ? Math.max(0, allGaps.length - FREE_PREVIEW_GAPS) : 0;

  const mustHaveGaps = visibleGaps.filter(
    (s) => s.importance === "must-have"
  );
  const niceToHaveGaps = visibleGaps.filter(
    (s) => s.importance === "nice-to-have"
  );

  const title = job ? `${job.title} at ${job.company_name}` : "Job Fit Analysis";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-w-full bg-slate-900 border-slate-700 p-0 flex flex-col max-h-[90vh] rounded-t-2xl"
            : "w-[540px] md:w-[640px] max-w-full md:max-w-[640px] bg-slate-900 border-slate-700 p-0 flex flex-col h-screen md:h-full"
        }
      >
        {isMobile && <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2 mb-1 shrink-0" />}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-400" />
            <SheetTitle className="text-white">{title}</SheetTitle>
          </div>
          <SheetDescription>
            {job ? (
              <Badge className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-[10px]">
                {profile.currentTitle ?? "Your Profile"} &rarr; {job.title}
              </Badge>
            ) : (
              <span className="text-slate-400 text-sm">
                Paste a job description to analyze your fit
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-6">
            {/* Input phase — show textarea when no job is provided and no results yet */}
            {!job && !externalJD && !result && !analyzing && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescInput}
                  onChange={(e) => setJobDescInput(e.target.value)}
                  placeholder="Paste the full job description here (minimum 50 characters)..."
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-[10px] ${jobDescInput.length >= 50 ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {jobDescInput.length}/50 min characters
                  </span>
                </div>
              </div>
            )}

            {/* Job summary when job is provided */}
            {job && !result && !analyzing && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Job Summary
                </h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.company_name}</p>
                  {job.location && (
                    <p className="text-xs text-slate-500">{job.location}</p>
                  )}
                  {job.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.matchedSkills.map((s) => (
                        <Badge
                          key={s}
                          className="bg-teal-900/30 border-teal-700/30 text-teal-300 text-[10px]"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analyzing spinner */}
            {analyzing && (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 text-teal-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Analyzing your fit...</p>
                <p className="text-xs text-slate-500 mt-1">
                  This takes about 10-15 seconds
                </p>
              </div>
            )}

            {/* Upgrade prompt */}
            {upgradeNeeded && (
              <UpgradePrompt
                feature="skill gap analysis"
                message={upgradeNeeded.message}
                upgradeUrl={upgradeNeeded.url}
              />
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={handleAnalyze}
                  className="text-xs text-teal-400 hover:text-teal-300 mt-2 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <>
                {/* Score Ring + Fit Label */}
                <div className="text-center py-2">
                  <ScoreRing score={result.overallFitScore} animated={animated} />
                  <p className="text-sm font-semibold text-white mt-2">
                    {result.fitLabel}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {result.matchedSkills.length} skills matched &middot;{" "}
                    {result.missingSkills.length} gaps found
                  </p>
                </div>

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

                  {/* Contextual gate for remaining gaps */}
                  {isFreeTier && hiddenGapCount > 0 && (
                    <div className="px-1 py-2">
                      <ContextualGate
                        count={hiddenGapCount}
                        label="more gaps"
                        cta="Upgrade to see all gaps"
                        onUpgrade={() => window.location.href = "/pricing"}
                      />
                    </div>
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
                              <p className="text-xs text-slate-400 mt-1">
                                {g.gap}
                              </p>
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
                      {isFreeTier ? (
                        <UpgradePrompt
                          feature="weekly action plan"
                          variant="gate"
                          price="$19"
                          message="Upgrade to get your personalized weekly action plan"
                          location="gap_analysis_action_plan"
                        />
                      ) : (
                        <div className="space-y-4">
                          {result.weeklyActionPlan.map((week) => (
                            <div
                              key={week.week}
                              className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3"
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
                      )}
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
                              className="text-xs text-slate-300 flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg"
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
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-slate-700/60 shrink-0">
          {!result ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleAnalyze}
                disabled={
                  analyzing ||
                  (!job && !externalJD && jobDescInput.length < 50)
                }
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Analyze Fit
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              {onOpenResume && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onOpenResume();
                  }}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generate Resume
                </button>
              )}
              {onOpenCoverLetter && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onOpenCoverLetter();
                  }}
                  className="flex-1 px-4 py-2.5 border border-teal-600 text-teal-300 hover:bg-teal-900/30 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileSignature className="h-4 w-4" />
                  Cover Letter
                </button>
              )}
              {onOpenTailor && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onOpenTailor();
                  }}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Tailor Resume
                </button>
              )}
              <button
                onClick={() => {
                  setResult(null);
                  setAnimated(false);
                }}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reanalyze
              </button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
