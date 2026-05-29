"use client";

import { Target, TrendingUp, BookOpen, Compass } from "lucide-react";

interface PlanContext {
  completionPercent: number;
  nextMilestone: string | null;
  currentPhase: string;
  targetRole: string;
  incompleteMilestones: string[];
  skillGaps: { skill: string; priority: string }[];
}

interface SuggestedTopicsProps {
  planContext: PlanContext;
  onSelect: (text: string) => void;
}

function buildTopics(ctx: PlanContext): { icon: React.ReactNode; label: string; prompt: string }[] {
  const topics: { icon: React.ReactNode; label: string; prompt: string }[] = [];

  if (ctx.nextMilestone) {
    const short = ctx.nextMilestone.length > 50 ? ctx.nextMilestone.slice(0, 50) + "..." : ctx.nextMilestone;
    topics.push({
      icon: <Target className="w-3.5 h-3.5" />,
      label: `How to tackle: ${short}`,
      prompt: `I want to work on my next milestone: "${ctx.nextMilestone}". Can you help me break it down into actionable steps and suggest how to get started this week?`,
    });
  }

  topics.push({
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: ctx.completionPercent > 0
      ? `Am I on track at ${ctx.completionPercent}%?`
      : "Help me get started on my plan",
    prompt: ctx.completionPercent > 0
      ? `I'm at ${ctx.completionPercent}% completion on my career pivot plan. Am I on track? What should I prioritize to keep momentum?`
      : "I haven't started on my milestones yet. Can you help me figure out what to do first and how to build momentum?",
  });

  if (ctx.skillGaps.length > 0) {
    const highPriority = ctx.skillGaps.find((g) => g.priority === "high");
    const skill = highPriority?.skill ?? ctx.skillGaps[0].skill;
    topics.push({
      icon: <BookOpen className="w-3.5 h-3.5" />,
      label: `Close my skill gap in ${skill}`,
      prompt: `I need to develop my ${skill} skills for the ${ctx.targetRole} role. What's the most efficient way to build this skill? Can you recommend specific resources or projects?`,
    });
  } else {
    topics.push({
      icon: <BookOpen className="w-3.5 h-3.5" />,
      label: `Key skills for ${ctx.targetRole}`,
      prompt: `What are the most important skills I should develop for the ${ctx.targetRole} role, and how should I prioritize learning them?`,
    });
  }

  topics.push({
    icon: <Compass className="w-3.5 h-3.5" />,
    label: "General coaching advice",
    prompt: `I'd like some general coaching advice about my career pivot to ${ctx.targetRole}. What strategies have you seen work well for career changers in this field?`,
  });

  return topics.slice(0, 4);
}

export default function SuggestedTopics({ planContext, onSelect }: SuggestedTopicsProps) {
  const topics = buildTopics(planContext);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {topics.map((topic, i) => (
        <button
          key={i}
          onClick={() => onSelect(topic.prompt)}
          className="flex items-start gap-2.5 text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-teal-500/30 text-slate-300 hover:text-white transition-all text-xs leading-snug group"
        >
          <span className="mt-0.5 text-teal-500 group-hover:text-teal-400 transition-colors shrink-0">
            {topic.icon}
          </span>
          {topic.label}
        </button>
      ))}
    </div>
  );
}
