"use client";

import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  GraduationCap,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { useLocale } from "next-intl";

interface SkillGapInput {
  skill: string;
  currentLevel: string;
  requiredLevel: string;
  priority: string;
}

interface Resource {
  name: string;
  provider: string;
  type: string;
  url: string;
  cost: string;
  duration: string;
  level: string;
  reason: string;
}

interface SkillRecommendation {
  skill: string;
  priority: string;
  resources: Resource[];
}

interface LearningPath {
  totalEstimatedTime: string;
  suggestedOrder: string[];
  quickWins: string[];
}

interface LearningResourceResult {
  recommendations: SkillRecommendation[];
  learningPath: LearningPath;
}

interface LearningResourcesProps {
  skillGaps: SkillGapInput[];
  targetRole?: string;
}

const TYPE_LABELS: Record<string, string> = {
  course: "Course",
  certification: "Certification",
  tutorial: "Tutorial",
  book: "Book",
  youtube: "YouTube",
  practice: "Practice",
};

export default function LearningResources({
  skillGaps,
  targetRole,
}: LearningResourcesProps) {
  const locale = useLocale();
  const [data, setData] = useState<LearningResourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function fetchResources() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/learning-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillGaps, targetRole, locale }),
      });
      if (!res.ok) throw new Error("Failed to load recommendations");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!data && !loading) {
    return (
      <section className="mb-8">
        <button
          onClick={fetchResources}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-teal-600/30 bg-teal-950/20 hover:bg-teal-950/40 p-5 transition-colors"
        >
          <GraduationCap className="h-5 w-5 text-teal-400" />
          <span className="font-semibold text-sm text-teal-300">
            Get Learning Recommendations for {skillGaps.length} Skill Gaps
          </span>
        </button>
        {error && (
          <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
        )}
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-8">
          <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
          <span className="text-sm text-slate-400">
            Finding the best courses and resources...
          </span>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="mb-8 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-teal-400" />
        Recommended Learning Resources
      </h2>

      {data.learningPath.quickWins.length > 0 && (
        <div className="rounded-xl bg-emerald-950/20 border border-emerald-800/30 p-4">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
            <Zap className="h-4 w-4" /> Quick Wins (1-2 weeks)
          </h3>
          <ul className="space-y-1">
            {data.learningPath.quickWins.map((win, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Learning Path</h3>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {data.learningPath.totalEstimatedTime}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.learningPath.suggestedOrder.map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-700/50 px-2.5 py-1 rounded-lg text-slate-300"
            >
              <span className="text-teal-400 font-bold">{i + 1}</span>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.recommendations.map((rec) => {
          const isOpen = expanded[rec.skill] ?? false;
          return (
            <div
              key={rec.skill}
              className="rounded-xl border border-slate-700/40 bg-slate-800/40 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [rec.skill]: !prev[rec.skill],
                  }))
                }
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-200">
                    {rec.skill}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      rec.priority === "high"
                        ? "bg-red-500/20 text-red-400"
                        : rec.priority === "medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {rec.resources.length} resources
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700/40 p-4 space-y-3">
                  {rec.resources.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-900/40 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-teal-300 hover:text-teal-200 inline-flex items-center gap-1"
                          >
                            {r.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span>{r.provider}</span>
                            <span className="bg-slate-700/50 px-1.5 py-0.5 rounded">
                              {TYPE_LABELS[r.type] || r.type}
                            </span>
                            <span className="capitalize">{r.level}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{r.reason}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> {r.cost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
