"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  AlertTriangle,
  ArrowRight,
  Zap,
  MapPin,
  X,
  Sparkles,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import type { CareerPathNode, CareerPathResult } from "@/app/api/career-path/route";

type ExpandedState = Record<string, boolean>;

const difficultyConfig = {
  low: { label: "Easy Transition", color: "text-emerald-400", bg: "bg-emerald-900/40 border-emerald-700/40", bar: "bg-emerald-500", width: "w-1/3" },
  medium: { label: "Moderate", color: "text-amber-400", bg: "bg-amber-900/40 border-amber-700/40", bar: "bg-amber-500", width: "w-2/3" },
  high: { label: "Challenging", color: "text-red-400", bg: "bg-red-900/40 border-red-700/40", bar: "bg-red-500", width: "w-full" },
} as const;

const demandConfig = {
  low: { label: "Low Demand", color: "text-slate-400" },
  moderate: { label: "Moderate Demand", color: "text-teal-400" },
  high: { label: "High Demand", color: "text-emerald-400" },
  "very-high": { label: "Very High Demand", color: "text-emerald-300" },
} as const;

const pathColors = [
  { line: "from-teal-500 to-teal-700", badge: "bg-teal-900/50 border-teal-700/50 text-teal-300", dot: "bg-teal-500", glow: "shadow-teal-500/30" },
  { line: "from-violet-500 to-violet-700", badge: "bg-violet-900/50 border-violet-700/50 text-violet-300", dot: "bg-violet-500", glow: "shadow-violet-500/30" },
  { line: "from-amber-500 to-amber-700", badge: "bg-amber-900/50 border-amber-700/50 text-amber-300", dot: "bg-amber-500", glow: "shadow-amber-500/30" },
  { line: "from-rose-500 to-rose-700", badge: "bg-rose-900/50 border-rose-700/50 text-rose-300", dot: "bg-rose-500", glow: "shadow-rose-500/30" },
];

function formatSalary(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}

function SkillGapBar({ current, required }: { current: string; required: string }) {
  const levels = ["none", "beginner", "intermediate", "advanced", "expert"];
  const currentIdx = levels.indexOf(current);
  const requiredIdx = levels.indexOf(required);
  const currentPct = (currentIdx / (levels.length - 1)) * 100;
  const requiredPct = (requiredIdx / (levels.length - 1)) * 100;

  return (
    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-teal-600 rounded-full"
        style={{ width: `${currentPct}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 border-r-2 border-amber-400"
        style={{ width: `${requiredPct}%` }}
      />
    </div>
  );
}

function MilestoneTimeline({ milestones }: { milestones: { sixMonth: string; oneYear: string; twoYear: string } }) {
  const items = [
    { label: "6 Months", text: milestones.sixMonth, color: "bg-emerald-500" },
    { label: "1 Year", text: milestones.oneYear, color: "bg-teal-500" },
    { label: "2 Years", text: milestones.twoYear, color: "bg-cyan-500" },
  ];

  return (
    <div className="relative pl-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative flex items-start gap-3">
            <div className={`absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full ${item.color} ring-2 ring-slate-900`} />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <p className="text-xs text-slate-300 mt-0.5">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeDetail({
  node,
  colorIdx,
  onClose,
}: {
  node: CareerPathNode;
  colorIdx: number;
  onClose: () => void;
}) {
  const diff = difficultyConfig[node.transitionDifficulty];
  const demand = demandConfig[node.marketDemand];
  const colors = pathColors[colorIdx % pathColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}>
                {node.industry}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{node.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mt-2">{node.whyGoodFit}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/60 rounded-xl p-3 text-center">
            <DollarSign className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Salary Range</p>
            <p className="text-sm font-bold text-white">{formatSalary(node.salaryMin)} – {formatSalary(node.salaryMax)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-teal-400 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Timeline</p>
            <p className="text-sm font-bold text-white">{node.timelineMonths}mo</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 text-center">
            <TrendingUp className={`h-4 w-4 ${demand.color} mx-auto mb-1`} />
            <p className="text-xs text-slate-500">Demand</p>
            <p className={`text-sm font-bold ${demand.color}`}>{demand.label.replace(" Demand", "")}</p>
          </div>
        </div>

        {/* Difficulty bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Transition Difficulty</span>
            <span className={`text-xs font-medium ${diff.color}`}>{diff.label}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${diff.bar} ${diff.width} transition-all duration-500`} />
          </div>
        </div>

        {/* Required skills */}
        {node.requiredSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Required Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.requiredSkills.map((skill, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skill gaps */}
        {node.skillGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skill Gaps to Close</span>
            </div>
            <div className="space-y-2.5">
              {node.skillGaps.map((gap, i) => (
                <div key={i} className="bg-slate-900/60 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{gap.skill}</span>
                    <span className="text-[10px] text-slate-500">{gap.acquisitionWeeks}w to learn</span>
                  </div>
                  <SkillGapBar current={gap.currentLevel} required={gap.requiredLevel} />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-600 capitalize">{gap.currentLevel}</span>
                    <span className="text-[10px] text-amber-400/70 capitalize">{gap.requiredLevel}</span>
                  </div>
                  {gap.resources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {gap.resources.map((r, j) => (
                        <span key={j} className="text-[10px] text-teal-400/80 bg-teal-900/20 px-2 py-0.5 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {node.requiredCertifications.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Certifications</span>
            </div>
            <div className="space-y-1">
              {node.requiredCertifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs text-slate-300">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Milestones</span>
          </div>
          <MilestoneTimeline milestones={node.milestones} />
        </div>
      </div>
    </motion.div>
  );
}

function TreeNode({
  node,
  depth,
  colorIdx,
  isLast,
  onSelect,
  isSelected,
}: {
  node: CareerPathNode;
  depth: number;
  colorIdx: number;
  isLast: boolean;
  onSelect: (node: CareerPathNode) => void;
  isSelected: boolean;
}) {
  const diff = difficultyConfig[node.transitionDifficulty];
  const colors = pathColors[colorIdx % pathColors.length];

  return (
    <div className="relative flex items-stretch">
      {/* Connector line */}
      <div className="relative flex flex-col items-center mr-3" style={{ width: 20 }}>
        <div className={`w-3.5 h-3.5 rounded-full ${colors.dot} ring-2 ring-slate-900 shadow-lg ${colors.glow} z-10 mt-4 shrink-0`} />
        {!isLast && (
          <div className={`flex-1 w-px bg-gradient-to-b ${colors.line} opacity-40`} />
        )}
      </div>

      {/* Card */}
      <motion.button
        onClick={() => onSelect(node)}
        className={`flex-1 text-left mb-3 rounded-xl border transition-all cursor-pointer min-h-[44px] p-3 ${
          isSelected
            ? "bg-slate-800 border-teal-500/50 shadow-lg shadow-teal-500/10"
            : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80"
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
              {node.marketDemand === "high" || node.marketDemand === "very-high" ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/40 text-emerald-300">
                  <Zap className="inline h-2.5 w-2.5 mr-0.5" />
                  {node.marketDemand === "very-high" ? "Hot" : "In Demand"}
                </span>
              ) : null}
            </div>
            <h4 className="text-sm font-semibold text-white truncate">{node.title}</h4>
            <p className="text-xs text-slate-500 truncate">{node.industry}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-emerald-400">
              {formatSalary(node.salaryMin)} – {formatSalary(node.salaryMax)}
            </p>
            <p className="text-[10px] text-slate-500">{node.timelineMonths}mo transition</p>
          </div>
        </div>

        {/* Skill gap preview */}
        {node.skillGaps.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">{node.skillGaps.length} skill gap{node.skillGaps.length > 1 ? "s" : ""}</span>
            <div className="flex gap-1">
              {node.skillGaps.slice(0, 3).map((g, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400/80 border border-amber-700/30">
                  {g.skill}
                </span>
              ))}
              {node.skillGaps.length > 3 && (
                <span className="text-[10px] text-slate-500">+{node.skillGaps.length - 3}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-1 text-teal-400">
          <span className="text-[10px] font-medium">Explore details</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </motion.button>
    </div>
  );
}

function PathBranch({
  path,
  colorIdx,
  expanded,
  onToggle,
  selectedNode,
  onSelectNode,
}: {
  path: { id: string; direction: string; nodes: CareerPathNode[] };
  colorIdx: number;
  expanded: boolean;
  onToggle: () => void;
  selectedNode: CareerPathNode | null;
  onSelectNode: (node: CareerPathNode) => void;
}) {
  const colors = pathColors[colorIdx % pathColors.length];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer min-h-[44px] mb-2"
      >
        <div className={`w-3 h-3 rounded-full ${colors.dot} shadow-lg ${colors.glow}`} />
        <span className="text-sm font-bold text-white flex-1 text-left">{path.direction}</span>
        <span className="text-xs text-slate-500 mr-2">{path.nodes.length} role{path.nodes.length > 1 ? "s" : ""}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-4"
          >
            {path.nodes.map((node, nodeIdx) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={nodeIdx}
                colorIdx={colorIdx}
                isLast={nodeIdx === path.nodes.length - 1}
                onSelect={onSelectNode}
                isSelected={selectedNode?.id === node.id}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingState() {
  const steps = [
    "Analyzing your skills and experience...",
    "Mapping career transition pathways...",
    "Evaluating salary ranges and market demand...",
    "Identifying skill gaps and learning resources...",
    "Building your personalized career tree...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm text-slate-400 mt-6 text-center"
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= step ? "w-6 bg-teal-500" : "w-2 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-5">
        <Sparkles className="h-8 w-8 text-teal-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Discover Your Career Paths</h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
        Generate an interactive tree of career transitions personalized to your skills, experience, and constraints. See salary ranges, skill gaps, and milestones for each path.
      </p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 min-h-[44px]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generate Career Paths
      </button>
      <p className="text-xs text-slate-600 mt-3">
        Requires a completed profile from onboarding or LinkedIn import
      </p>
    </div>
  );
}

function NoProfileState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
        <BookOpen className="h-8 w-8 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile First</h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
        We need your skills, experience, and career goals to generate personalized career paths. Complete the onboarding assessment or import your LinkedIn profile.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a
          href="/onboarding"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/30 transition-all min-h-[44px]"
        >
          Start Assessment
        </a>
        <a
          href="/linkedin-import"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm hover:bg-slate-700 transition-all min-h-[44px]"
        >
          Import LinkedIn
        </a>
      </div>
    </div>
  );
}

export default function CareerPathClient() {
  const [result, setResult] = useState<CareerPathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedNode, setSelectedNode] = useState<CareerPathNode | null>(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.profile?.skills?.length) {
          setHasProfile(true);
          return;
        }
      }
    } catch {}
    setHasProfile(false);
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const raw = sessionStorage.getItem("intake_result");
      if (!raw) throw new Error("No profile data found");
      const data = JSON.parse(raw);

      const res = await fetch("/api/career-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: data.profile,
          circumstances: data.profile?.circumstances,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to generate career paths");
      }

      const pathData: CareerPathResult = await res.json();
      setResult(pathData);

      const initial: ExpandedState = {};
      pathData.paths.forEach((p) => {
        initial[p.id] = true;
      });
      setExpanded(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSelectNode(node: CareerPathNode, colorIdx: number) {
    setSelectedNode(node);
    setSelectedColorIdx(colorIdx);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  if (hasProfile === null) {
    return (
      <>
        <SiteNav />
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Career Path Explorer</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Interactive Career Path Visualization</h1>
          <p className="text-sm text-slate-400">
            Explore possible career transitions from your current role. Click any role to see detailed skill gaps, milestones, and resources.
          </p>
        </div>

        {!hasProfile ? (
          <NoProfileState />
        ) : !result && !loading ? (
          <EmptyState onGenerate={generate} loading={loading} />
        ) : loading ? (
          <LoadingState />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={generate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition-all min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        ) : result ? (
          <>
            {/* Root node */}
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Current Role</p>
                <p className="text-base font-bold text-white">{result.rootTitle}</p>
                <p className="text-xs text-slate-400">{result.rootIndustry}</p>
              </div>
              <button
                onClick={generate}
                className="ml-auto text-xs text-teal-400 hover:text-teal-300 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors min-h-[44px] shrink-0"
              >
                Regenerate
              </button>
            </div>

            {/* Two-column layout: tree + detail panel */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Tree view */}
              <div className="lg:col-span-3 space-y-3">
                {result.paths.map((path, pathIdx) => (
                  <PathBranch
                    key={path.id}
                    path={path}
                    colorIdx={pathIdx}
                    expanded={!!expanded[path.id]}
                    onToggle={() => setExpanded((prev) => ({ ...prev, [path.id]: !prev[path.id] }))}
                    selectedNode={selectedNode}
                    onSelectNode={(node) => handleSelectNode(node, pathIdx)}
                  />
                ))}
              </div>

              {/* Detail panel */}
              <div className="lg:col-span-2" ref={detailRef}>
                <AnimatePresence mode="wait">
                  {selectedNode ? (
                    <NodeDetail
                      key={selectedNode.id}
                      node={selectedNode}
                      colorIdx={selectedColorIdx}
                      onClose={() => setSelectedNode(null)}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8 text-center"
                    >
                      <Target className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Click a career path node to explore details</p>
                      <p className="text-xs text-slate-600 mt-1">See skill gaps, milestones, salary data, and certifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
