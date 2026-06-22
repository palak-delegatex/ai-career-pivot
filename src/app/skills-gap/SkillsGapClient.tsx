"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Target,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import type { SkillsGapAnalysis, SkillGapItem, Course } from "@/app/api/skills-gap/route";

const LEVEL_ORDER = ["none", "beginner", "intermediate", "advanced", "expert"];
const LEVEL_PERCENT: Record<string, number> = {
  none: 0,
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

const IMPORTANCE_CONFIG = {
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-950/30 border-red-900/40",
    badge: "bg-red-900/40 text-red-400 border-red-700/40",
    icon: XCircle,
  },
  important: {
    label: "Important",
    color: "text-amber-400",
    bg: "bg-amber-950/30 border-amber-900/40",
    badge: "bg-amber-900/40 text-amber-400 border-amber-700/40",
    icon: AlertTriangle,
  },
  "nice-to-have": {
    label: "Nice to Have",
    color: "text-blue-400",
    bg: "bg-blue-950/30 border-blue-900/40",
    badge: "bg-blue-900/40 text-blue-400 border-blue-700/40",
    icon: Sparkles,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-violet-900/40 text-violet-300 border-violet-700/40",
  soft: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  domain: "bg-teal-900/40 text-teal-300 border-teal-700/40",
  tool: "bg-cyan-900/40 text-cyan-300 border-cyan-700/40",
  certification: "bg-amber-900/40 text-amber-300 border-amber-700/40",
};

const COST_COLORS: Record<string, string> = {
  free: "text-emerald-400",
  paid: "text-amber-400",
};

function ScoreRing({ score, size = 144 }: { score: number; size?: number }) {
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : score >= 25 ? "text-orange-400" : "text-red-400";
  const strokeColor = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : score >= 25 ? "#fb923c" : "#f87171";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
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

function SkillLevelBar({ current, required }: { current: string; required: string }) {
  const currentPct = LEVEL_PERCENT[current] ?? 0;
  const requiredPct = LEVEL_PERCENT[required] ?? 100;

  return (
    <div className="space-y-1">
      <div className="relative h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${currentPct}%` }} />
        <div className="absolute inset-y-0 left-0 border-r-2 border-amber-400" style={{ width: `${requiredPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-teal-400 capitalize">{current === "none" ? "No experience" : current}</span>
        <span className="text-amber-400 capitalize">Need: {required}</span>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const isFree = course.cost.toLowerCase().includes("free");
  const typeIcons: Record<string, string> = {
    course: "📚",
    certification: "🏆",
    tutorial: "📖",
    book: "📕",
    youtube: "▶️",
    practice: "💻",
    bootcamp: "🎓",
  };

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 hover:border-teal-600/50 hover:bg-slate-800/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">{typeIcons[course.type] ?? "📚"}</span>
          <span className="text-sm font-medium text-white truncate group-hover:text-teal-300 transition-colors">
            {course.name}
          </span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 mt-0.5 transition-colors" />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-1.5">
        <span>{course.provider}</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span className="capitalize">{course.level}</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.duration}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500 line-clamp-1">{course.reason}</p>
        <span className={`text-[11px] font-semibold shrink-0 ml-2 ${isFree ? COST_COLORS.free : COST_COLORS.paid}`}>
          {course.cost}
        </span>
      </div>
    </a>
  );
}

function GapCard({ gap, isExpanded, onToggle }: { gap: SkillGapItem; isExpanded: boolean; onToggle: () => void }) {
  const config = IMPORTANCE_CONFIG[gap.importance];
  const Icon = config.icon;
  const weeksLabel = gap.estimatedWeeksToCompetency === 1 ? "1 week" : `${gap.estimatedWeeksToCompetency} weeks`;

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${config.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer min-h-[44px]"
      >
        <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{gap.skill}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[gap.category] ?? CATEGORY_COLORS.technical}`}>
              {gap.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {weeksLabel}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {gap.transferability.score}% transferable
            </span>
            <span className={`font-medium ${config.color}`}>#{gap.priorityRank} priority</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
              <SkillLevelBar current={gap.currentLevel} required={gap.requiredLevel} />

              {gap.transferability.note && (
                <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2.5">
                  <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{gap.transferability.note}</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recommended Courses</span>
                </div>
                <div className="space-y-2">
                  {gap.courses.map((course, i) => (
                    <CourseCard key={i} course={course} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LearningPhase({
  phase,
  index,
  color,
}: {
  phase: { title: string; weeks: string; focus: string[]; milestone: string };
  index: number;
  color: string;
}) {
  const colors = ["bg-emerald-500", "bg-teal-500", "bg-cyan-500"];
  const dotColor = colors[index] ?? colors[0];

  return (
    <div className="relative flex items-stretch">
      <div className="relative flex flex-col items-center mr-4" style={{ width: 20 }}>
        <div className={`w-4 h-4 rounded-full ${dotColor} ring-2 ring-slate-900 shadow-lg z-10 mt-4 shrink-0`} />
        {index < 2 && <div className="flex-1 w-px bg-gradient-to-b from-slate-600 to-slate-700 opacity-50" />}
      </div>
      <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-white">{phase.title}</h4>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {phase.weeks}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {phase.focus.map((f, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50">
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-start gap-2 text-xs text-teal-300 bg-teal-950/20 rounded-lg p-2">
          <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{phase.milestone}</span>
        </div>
      </div>
    </div>
  );
}

const POPULAR_ROLES = [
  "AI/ML Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "DevOps Engineer",
  "Full Stack Developer",
  "Cloud Architect",
  "Cybersecurity Analyst",
  "Data Analyst",
  "AI Prompt Engineer",
];

export default function SkillsGapClient() {
  const [phase, setPhase] = useState<"input" | "loading" | "results">("input");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<SkillsGapAnalysis | null>(null);
  const [error, setError] = useState("");
  const [expandedGaps, setExpandedGaps] = useState<Record<number, boolean>>({});
  const [filterImportance, setFilterImportance] = useState<string>("all");

  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [transferableSkills, setTransferableSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<number | undefined>();
  const [userExperience, setUserExperience] = useState<{ title: string; company: string; description: string }[]>([]);
  const [userEducation, setUserEducation] = useState<{ degree: string; field: string; institution: string }[]>([]);
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
          setCertifications(profile.certifications ?? []);
          setYearsExperience(profile.yearsExperience);
          setUserExperience(
            (profile.experience ?? []).map((e: { title: string; company: string; description: string }) => ({
              title: e.title, company: e.company, description: e.description,
            })),
          );
          setUserEducation(
            (profile.education ?? []).map((e: { degree: string; field: string; institution: string }) => ({
              degree: e.degree, field: e.field, institution: e.institution,
            })),
          );
          setProfileLoaded(true);
        }
      }
    } catch {}
  }, []);

  async function analyze() {
    if (!targetRole.trim()) return;
    if (!userSkills.length) {
      setError("No profile found. Complete the career assessment first to load your skills.");
      return;
    }

    setPhase("loading");
    setError("");

    try {
      const res = await fetch("/api/skills-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          userSkills,
          currentTitle,
          transferableSkills,
          userExperience,
          userEducation,
          certifications,
          yearsExperience,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: SkillsGapAnalysis = await res.json();
      setResult(data);
      setPhase("results");
      setExpandedGaps({ 0: true });
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("input");
    }
  }

  if (phase === "loading") {
    const steps = [
      "Mapping your current skill profile...",
      "Analyzing target role requirements...",
      "Identifying skill gaps and transferability...",
      "Finding personalized learning resources...",
      "Building your upskilling roadmap...",
    ];

    return (
      <>
        <SiteNav />
        <LoadingScreen steps={steps} />
      </>
    );
  }

  if (phase === "results" && result) {
    const criticalGaps = result.gaps.filter((g) => g.importance === "critical");
    const importantGaps = result.gaps.filter((g) => g.importance === "important");
    const niceGaps = result.gaps.filter((g) => g.importance === "nice-to-have");

    const filteredGaps =
      filterImportance === "all"
        ? result.gaps
        : result.gaps.filter((g) => g.importance === filterImportance);

    const totalCourses = result.gaps.reduce((sum, g) => sum + g.courses.length, 0);
    const freeCourses = result.gaps.reduce(
      (sum, g) => sum + g.courses.filter((c) => c.cost.toLowerCase().includes("free")).length,
      0,
    );

    return (
      <>
        <SiteNav />
        <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">Skills Gap Analysis</h1>
              <p className="text-slate-400 text-sm">
                {currentTitle && <span className="text-slate-300">{currentTitle}</span>}
                {currentTitle && " → "}
                <span className="text-teal-400">{result.targetRole}</span>
                {result.targetIndustry && <span className="text-slate-500"> ({result.targetIndustry})</span>}
              </p>
            </div>
            <button
              onClick={() => { setPhase("input"); setResult(null); setFilterImportance("all"); }}
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              Analyze another role →
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="md:col-span-1 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col items-center justify-center">
              <ScoreRing score={result.overallReadinessScore} size={120} />
              <div className="text-sm font-bold mt-2 text-center">{result.readinessLabel}</div>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">{result.existingStrengths.length}</div>
                <div className="text-[11px] text-slate-400">Strengths</div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
                <BarChart3 className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">{result.gaps.length}</div>
                <div className="text-[11px] text-slate-400">Skill Gaps</div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-teal-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">~{result.totalEstimatedWeeks}w</div>
                <div className="text-[11px] text-slate-400">To Job-Ready</div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
                <BookOpen className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-white">{totalCourses}</div>
                <div className="text-[11px] text-slate-400">Courses ({freeCourses} free)</div>
              </div>
            </div>
          </div>

          {/* Existing Strengths */}
          {result.existingStrengths.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Your Strengths ({result.existingStrengths.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {result.existingStrengths.map((s, i) => (
                  <div key={i} className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{s.skill}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 font-medium capitalize">
                        {s.strengthLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{s.relevance}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Competitive Advantages */}
          {result.competitiveAdvantages.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" />
                Your Competitive Edge
              </h2>
              <div className="bg-teal-950/20 border border-teal-900/30 rounded-xl p-4 space-y-2">
                {result.competitiveAdvantages.map((adv, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                    {adv}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skill Gaps */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Skill Gaps ({result.gaps.length})
              </h2>
              <div className="flex gap-1.5">
                {[
                  { key: "all", label: "All", count: result.gaps.length },
                  { key: "critical", label: "Critical", count: criticalGaps.length },
                  { key: "important", label: "Important", count: importantGaps.length },
                  { key: "nice-to-have", label: "Nice", count: niceGaps.length },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterImportance(f.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filterImportance === f.key
                        ? "bg-teal-600/30 border-teal-500/50 text-teal-300"
                        : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredGaps.map((gap, i) => (
                <GapCard
                  key={`${gap.skill}-${i}`}
                  gap={gap}
                  isExpanded={!!expandedGaps[i]}
                  onToggle={() => setExpandedGaps((prev) => ({ ...prev, [i]: !prev[i] }))}
                />
              ))}
            </div>
          </section>

          {/* Learning Roadmap */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              Personalized Learning Roadmap
            </h2>
            <div className="pl-2">
              <LearningPhase phase={result.learningPath.phase1} index={0} color="emerald" />
              <LearningPhase phase={result.learningPath.phase2} index={1} color="teal" />
              <LearningPhase phase={result.learningPath.phase3} index={2} color="cyan" />
            </div>
          </section>

          {/* Quick Wins */}
          {result.quickWins.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Quick Wins — Start This Week
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.quickWins.map((qw, i) => (
                  <div key={i} className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-white">{qw.action}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 ml-5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {qw.timeframe}
                      </span>
                      <span className="text-amber-400/70">{qw.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-3 justify-center">
            <Link
              href="/gap-analysis"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors"
            >
              Analyze a Specific Job Posting
            </Link>
            <Link
              href="/career-path"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors"
            >
              Explore Career Paths
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Input phase
  return (
    <>
      <SiteNav />
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
            <BarChart3 className="w-3.5 h-3.5" />
            AI Skills Gap Analyzer
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            What Skills Do You Need?
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Enter your target role and we&apos;ll map every skill gap, rank them by priority, and recommend
            personalized courses to get you job-ready.
          </p>
        </div>

        {!profileLoaded && (
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-6 text-sm">
            <p className="text-amber-300 font-semibold mb-1">Profile not loaded</p>
            <p className="text-slate-400">
              Complete the{" "}
              <Link href="/onboarding" className="text-teal-400 hover:text-teal-300 underline">
                career assessment
              </Link>{" "}
              first so we can compare your skills against the target role.
            </p>
          </div>
        )}

        {profileLoaded && (
          <div className="bg-teal-950/20 border border-teal-800/30 rounded-xl p-4 mb-6 text-sm">
            <p className="text-teal-300 font-semibold mb-1">
              Profile loaded
              {currentTitle && <span className="font-normal text-slate-400"> — {currentTitle}</span>}
            </p>
            <p className="text-slate-400">
              {userSkills.length} skills · {certifications.length} certifications · {userExperience.length} roles loaded
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="target-role" className="block text-sm font-medium text-slate-300 mb-2">
              Target Role
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. AI/ML Engineer, Product Manager, UX Designer..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">Popular roles:</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    targetRole === role
                      ? "bg-teal-600/30 border-teal-500/50 text-teal-300"
                      : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={analyze}
            disabled={!targetRole.trim() || !profileLoaded}
            className="w-full px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze My Skills Gap →
          </button>

          <p className="text-slate-500 text-xs text-center">
            AI-powered deep analysis takes ~15 seconds
          </p>
        </div>
      </main>
    </>
  );
}

function LoadingScreen({ steps }: { steps: string[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="relative inline-block mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">Analyzing Skills Gap</h2>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-slate-400 text-sm"
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-6 justify-center">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= step ? "w-6 bg-teal-500" : "w-2 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
