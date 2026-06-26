"use client";

import { useState, useEffect } from "react";
import {
  Target,
  CheckCircle2,
  ArrowRightLeft,
  BookOpen,
  GraduationCap,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type {
  UserProfile,
  SkillGapAnalysisResult,
  SkillGapItem,
  LearningResource,
} from "@/lib/intake";

interface SkillGapAnalysisPanelProps {
  profile: UserProfile;
  targetRole: string;
  targetIndustry?: string;
  onAnalysisComplete?: (result: SkillGapAnalysisResult) => void;
}

function ReadinessRing({
  score,
  animated,
}: {
  score: number;
  animated: boolean;
}) {
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
          {animated ? score : 0}
        </span>
        <span className="text-xs text-slate-400 mt-0.5">Readiness</span>
      </div>
    </div>
  );
}

function GapDistributionBar({
  matched,
  transferable,
  learnable,
  deep,
  animated,
}: {
  matched: number;
  transferable: number;
  learnable: number;
  deep: number;
  animated: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="h-3 rounded-full overflow-hidden bg-slate-700 flex">
        <div
          className="bg-emerald-500 transition-all duration-700 ease-out"
          style={{ width: animated ? `${matched}%` : "0%" }}
        />
        <div
          className="bg-teal-500 transition-all duration-700 ease-out delay-100"
          style={{ width: animated ? `${transferable}%` : "0%" }}
        />
        <div
          className="bg-amber-500 transition-all duration-700 ease-out delay-200"
          style={{ width: animated ? `${learnable}%` : "0%" }}
        />
        <div
          className="bg-red-500 transition-all duration-700 ease-out delay-300"
          style={{ width: animated ? `${deep}%` : "0%" }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Matched {matched}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-slate-400">Transferable {transferable}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-400">Learnable {learnable}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-400">Deep Investment {deep}%</span>
        </span>
      </div>
    </div>
  );
}

function ResourceCard({ resource }: { resource: LearningResource }) {
  const typeIcon = {
    course: BookOpen,
    certification: GraduationCap,
    project: Target,
    book: BookOpen,
    tutorial: Sparkles,
    bootcamp: GraduationCap,
  };
  const Icon = typeIcon[resource.type] || BookOpen;

  const costLabel = {
    free: "Free",
    low: "< $50",
    medium: "$50-200",
    high: "$200+",
  };

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
          <span>{resource.estimatedHours}h</span>
          <span>&middot;</span>
          <span>{costLabel[resource.cost]}</span>
          <span>&middot;</span>
          <span className="text-amber-400">Impact: {resource.impactScore}/10</span>
        </div>
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: SkillGapItem }) {
  const typeColors = {
    transferable: {
      bg: "bg-teal-900/10",
      border: "border-teal-800/30",
      title: "text-teal-300",
      badge: "bg-teal-900/40 border-teal-700/40 text-teal-300",
    },
    learnable: {
      bg: "bg-amber-900/10",
      border: "border-amber-800/30",
      title: "text-amber-300",
      badge: "bg-amber-900/40 border-amber-700/40 text-amber-300",
    },
    "deep-investment": {
      bg: "bg-red-900/10",
      border: "border-red-800/30",
      title: "text-red-300",
      badge: "bg-red-900/40 border-red-700/40 text-red-300",
    },
  };
  const colors = typeColors[gap.gapType];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className={`text-sm font-medium ${colors.title}`}>{gap.skill}</p>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] ${colors.badge}`}
          >
            {gap.importance}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            {gap.estimatedWeeksToClose}w
          </div>
        </div>
      </div>

      {gap.adjacentSkill && gap.transferExplanation && (
        <div className="flex items-start gap-2 mb-2 text-xs text-teal-300/80">
          <ArrowRightLeft className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">{gap.adjacentSkill}</span>
            {" → "}
            {gap.transferExplanation}
          </span>
        </div>
      )}

      {gap.bridgeActions.length > 0 && (
        <ul className="space-y-1 mb-2">
          {gap.bridgeActions.map((action, i) => (
            <li
              key={i}
              className="text-xs text-slate-400 flex items-start gap-1.5"
            >
              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-slate-600" />
              {action}
            </li>
          ))}
        </ul>
      )}

      {gap.learningPath.length > 0 && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-700/40">
          {gap.learningPath.map((resource, i) => (
            <ResourceCard key={i} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapPhase({
  phase,
}: {
  phase: SkillGapAnalysisResult["learningRoadmap"][number];
}) {
  const phaseConfig = {
    "quick-wins": {
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
    "deep-expertise": {
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
        <span className="text-[10px] text-slate-500">
          {phase.durationWeeks} weeks
        </span>
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
        <div className="space-y-1.5">
          {phase.resources.map((resource, i) => (
            <ResourceCard key={i} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillGapAnalysisPanel({
  profile,
  targetRole,
  targetIndustry,
  onAnalysisComplete,
}: SkillGapAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SkillGapAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setAnimated(false);

    try {
      const res = await fetch("/api/skill-gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            currentTitle: profile.currentTitle,
            currentIndustry: profile.currentIndustry,
            yearsExperience: profile.yearsExperience,
            skills: profile.skills,
            transferableSkills: profile.transferableSkills,
            experience: profile.experience,
            education: profile.education,
            certifications: profile.certifications,
            circumstances: profile.circumstances,
          },
          targetRole,
          targetIndustry,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data: SkillGapAnalysisResult = await res.json();
      setResult(data);
      onAnalysisComplete?.(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (targetRole && (profile.skills?.length || profile.experience?.length)) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRole]);

  if (analyzing) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center">
        <Loader2 className="h-10 w-10 text-teal-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-300 font-medium">
          Analyzing skill gaps for {targetRole}...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Extracting skills, mapping to target role, and building your learning roadmap
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={runAnalysis}
          className="text-xs text-teal-400 hover:text-teal-300 mt-3 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!result) return null;

  const { gaps, summary, learningRoadmap, matchedSkills } = result;
  const totalGaps =
    gaps.transferable.length + gaps.learnable.length + gaps.deepInvestment.length;

  return (
    <div className="space-y-6">
      {/* Header: Readiness Score + Distribution */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ReadinessRing score={summary.readinessScore} animated={animated} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-lg font-bold text-white">
                {summary.readinessLabel}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {matchedSkills.length} skills matched &middot; {totalGaps} gaps
                identified &middot; ~{summary.estimatedTransitionWeeks} weeks to
                transition
              </p>
            </div>
            <GapDistributionBar
              matched={summary.matchedPercent}
              transferable={summary.transferablePercent}
              learnable={summary.learnablePercent}
              deep={summary.deepInvestmentPercent}
              animated={animated}
            />
          </div>
        </div>

        {/* Narrative */}
        <div className="mt-4 p-3 bg-slate-900/40 rounded-lg border border-slate-700/50">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              {summary.transitionNarrative}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-2.5 bg-emerald-900/10 border border-emerald-800/20 rounded-lg">
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
              Top Strength
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              {summary.topStrength}
            </p>
          </div>
          <div className="p-2.5 bg-red-900/10 border border-red-800/20 rounded-lg">
            <p className="text-[10px] text-red-400 font-medium uppercase tracking-wider">
              Biggest Gap
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              {summary.biggestGap}
            </p>
          </div>
        </div>
      </div>

      {/* Gap Details */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <Accordion
          type="multiple"
          defaultValue={["transferable", "learnable", "roadmap"]}
        >
          {/* Matched Skills */}
          <AccordionItem value="matched">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Matched Skills
              </span>
              <Badge className="ml-auto mr-2 bg-emerald-900/30 border-emerald-700/30 text-emerald-300 text-[10px]">
                {matchedSkills.length}
              </Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1.5 bg-emerald-900/20 border border-emerald-700/30 rounded-lg text-xs text-emerald-300"
                  >
                    {s.skill}
                    <span className="text-emerald-500/60 ml-1">
                      {s.matchConfidence}%
                    </span>
                  </span>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Transferable Gaps */}
          {gaps.transferable.length > 0 && (
            <AccordionItem value="transferable">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-teal-400" />
                  Transferable Skills
                </span>
                <Badge className="ml-auto mr-2 bg-teal-900/30 border-teal-700/30 text-teal-300 text-[10px]">
                  {gaps.transferable.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-[10px] text-slate-500 mb-3">
                  You have adjacent skills — bridge the gap with targeted actions
                </p>
                <div className="space-y-3">
                  {gaps.transferable.map((gap, i) => (
                    <GapCard key={i} gap={gap} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Learnable Gaps */}
          {gaps.learnable.length > 0 && (
            <AccordionItem value="learnable">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  Learnable Skills
                </span>
                <Badge className="ml-auto mr-2 bg-amber-900/30 border-amber-700/30 text-amber-300 text-[10px]">
                  {gaps.learnable.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-[10px] text-slate-500 mb-3">
                  New skills you can acquire in under 3 months with focused effort
                </p>
                <div className="space-y-3">
                  {gaps.learnable.map((gap, i) => (
                    <GapCard key={i} gap={gap} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Deep Investment Gaps */}
          {gaps.deepInvestment.length > 0 && (
            <AccordionItem value="deep-investment">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-red-400" />
                  Deep Investment
                </span>
                <Badge className="ml-auto mr-2 bg-red-900/30 border-red-700/30 text-red-300 text-[10px]">
                  {gaps.deepInvestment.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-[10px] text-slate-500 mb-3">
                  Significant upskilling needed — certifications, bootcamps, or 3+ months of study
                </p>
                <div className="space-y-3">
                  {gaps.deepInvestment.map((gap, i) => (
                    <GapCard key={i} gap={gap} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Learning Roadmap */}
          <AccordionItem value="roadmap">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-400" />
                Learning Roadmap
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {learningRoadmap.map((phase, i) => (
                  <RoadmapPhase key={i} phase={phase} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
