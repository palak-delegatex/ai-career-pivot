"use client";

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
} from "lucide-react";

export interface BadgeDefinition {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_step",
    label: "First Step",
    description: "Complete your first milestone",
    icon: <Footprints className="h-5 w-5" />,
  },
  {
    key: "phase_complete",
    label: "Phase Complete",
    description: "Complete all milestones in a phase",
    icon: <Award className="h-5 w-5" />,
  },
  {
    key: "streak_master",
    label: "Streak Master",
    description: "Achieve a 7-day completion streak",
    icon: <Flame className="h-5 w-5" />,
  },
  {
    key: "halfway_there",
    label: "Halfway There",
    description: "Complete 50% of all milestones",
    icon: <Target className="h-5 w-5" />,
  },
  {
    key: "career_ready",
    label: "Career Ready",
    description: "Complete 100% of all milestones",
    icon: <GraduationCap className="h-5 w-5" />,
  },
];

interface CompletionBadgesProps {
  earnedBadges: Set<string>;
}

export default function CompletionBadges({
  earnedBadges,
}: CompletionBadgesProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4">Badges</h3>

      <TooltipProvider delayDuration={100}>
        <div className="flex flex-wrap gap-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = earnedBadges.has(badge.key);
            return (
              <Tooltip key={badge.key}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      earned
                        ? "bg-slate-800 border-2 border-[hsl(var(--accent))] text-teal-400 shadow-lg shadow-teal-900/30"
                        : "bg-slate-800/40 border border-slate-700 text-slate-600"
                    }`}
                  >
                    {earned ? badge.icon : <Lock className="h-4 w-4" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">{badge.label}</p>
                  <p className="text-xs text-slate-400">{badge.description}</p>
                  {!earned && (
                    <p className="text-[10px] text-slate-500 mt-1">Locked</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
