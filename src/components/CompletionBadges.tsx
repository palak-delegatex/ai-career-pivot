"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Footprints,
  Award,
  Flame,
  Target,
  GraduationCap,
  Lock,
  Send,
  BookOpen,
  Users,
  Mic,
  Zap,
} from "lucide-react";

export interface BadgeDefinition {
  key: string;
  /** i18n key suffix under completionBadges.badges.<i18nKey> */
  i18nKey: string;
  /** English fallback label; prefer translating via completionBadges.badges.<i18nKey>.label */
  label: string;
  /** English fallback description; prefer translating via completionBadges.badges.<i18nKey>.description */
  description: string;
  icon: React.ReactNode;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_step",
    i18nKey: "firstStep",
    label: "First Step",
    description: "Complete your first milestone",
    icon: <Footprints className="h-5 w-5" />,
  },
  {
    key: "first_application",
    i18nKey: "firstApplication",
    label: "First Application Sent",
    description: "Submit your first job application",
    icon: <Send className="h-5 w-5" />,
  },
  {
    key: "five_skills",
    i18nKey: "fiveSkills",
    label: "5 Skills Acquired",
    description: "Complete 5 skill-building milestones",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    key: "ten_connections",
    i18nKey: "tenConnections",
    label: "10 Connections Made",
    description: "Add 10 contacts to your network",
    icon: <Users className="h-5 w-5" />,
  },
  {
    key: "interview_unlocked",
    i18nKey: "interviewUnlocked",
    label: "Interview Unlocked",
    description: "Reach the Applicant stage of your transition",
    icon: <Mic className="h-5 w-5" />,
  },
  {
    key: "streak_master",
    i18nKey: "streakMaster",
    label: "Streak Master",
    description: "Achieve a 7-day completion streak",
    icon: <Flame className="h-5 w-5" />,
  },
  {
    key: "phase_complete",
    i18nKey: "phaseComplete",
    label: "Phase Complete",
    description: "Complete all milestones in a phase",
    icon: <Award className="h-5 w-5" />,
  },
  {
    key: "halfway_there",
    i18nKey: "halfwayThere",
    label: "Halfway There",
    description: "Complete 50% of all milestones",
    icon: <Target className="h-5 w-5" />,
  },
  {
    key: "momentum",
    i18nKey: "momentum",
    label: "Momentum Builder",
    description: "Complete 3 milestones in a single week",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    key: "career_ready",
    i18nKey: "careerReady",
    label: "Career Ready",
    description: "Complete 100% of all milestones",
    icon: <GraduationCap className="h-5 w-5" />,
  },
];

const SEEN_BADGES_KEY = "aicareerpivot:badges:seen";

function getSeenBadges(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_BADGES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markBadgeSeen(key: string) {
  const seen = getSeenBadges();
  seen.add(key);
  localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seen]));
}

interface CompletionBadgesProps {
  earnedBadges: Set<string>;
}

function ParticleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * 24;
        const ty = Math.sin(rad) * 24;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-teal-400 opacity-0"
            style={{
              animation: "particle-burst 500ms ease-out forwards",
              animationDelay: `${i * 30}ms`,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function CompletionBadges({
  earnedBadges,
}: CompletionBadgesProps) {
  const t = useTranslations("completionBadges");
  const [animatingBadges, setAnimatingBadges] = useState<Set<string>>(new Set());
  const prevEarnedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const seen = getSeenBadges();
    const newlyEarned = new Set<string>();

    for (const key of earnedBadges) {
      if (!seen.has(key) && !prevEarnedRef.current.has(key)) {
        newlyEarned.add(key);
        markBadgeSeen(key);
      }
    }

    if (newlyEarned.size > 0) {
      setAnimatingBadges(newlyEarned);
      const timer = setTimeout(() => setAnimatingBadges(new Set()), 600);
      return () => clearTimeout(timer);
    }

    prevEarnedRef.current = new Set(earnedBadges);
  }, [earnedBadges]);

  return (
    <>
      <style>{`
        @keyframes badge-earn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes particle-burst {
          0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)); opacity: 0; }
        }
      `}</style>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">{t("title")}</h3>

        <TooltipProvider delayDuration={100}>
          <div className="flex flex-wrap gap-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const earned = earnedBadges.has(badge.key);
              const isAnimating = animatingBadges.has(badge.key);
              const label = t(`badges.${badge.i18nKey}.label`);
              const description = t(`badges.${badge.i18nKey}.description`);
              return (
                <Tooltip key={badge.key}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-default ${
                        earned
                          ? "bg-slate-800 border-2 border-[hsl(var(--accent))] text-teal-400 shadow-lg shadow-teal-900/30 hover:animate-[badge-float_1.5s_ease-in-out_infinite]"
                          : "bg-slate-800/40 border border-slate-700 text-slate-600"
                      }`}
                      style={
                        isAnimating
                          ? { animation: "badge-earn 300ms ease-out forwards" }
                          : undefined
                      }
                      title={
                        earned
                          ? t("tooltipTitle", { label, description })
                          : t("tooltipTitleLocked", { label, description })
                      }
                    >
                      {isAnimating && <ParticleBurst />}
                      {earned ? badge.icon : <Lock className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                    {!earned && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {t("locked")}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </>
  );
}
