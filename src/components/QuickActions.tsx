"use client";

import Link from "next/link";
import {
  FileText,
  Target,
  BarChart3,
  Mic,
  Briefcase,
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface QuickActionsProps {
  hasResume: boolean;
  hasGapAnalysis: boolean;
  hasJobsTracked: boolean;
  hasLinkedIn: boolean;
  hasMockInterview: boolean;
}

export default function QuickActions({
  hasResume,
  hasGapAnalysis,
  hasJobsTracked,
  hasLinkedIn,
  hasMockInterview,
}: QuickActionsProps) {
  const actions: QuickAction[] = [];

  if (!hasResume) {
    actions.push({ label: "Create your first resume", href: "/resume-generator", icon: FileText });
  }
  if (!hasGapAnalysis) {
    actions.push({ label: "Analyze a job posting", href: "/gap-analysis", icon: Target });
  }
  if (hasResume && !hasGapAnalysis) {
    actions.push({ label: "Check ATS compatibility", href: "/ats-score", icon: BarChart3 });
  }
  if (hasGapAnalysis && hasResume) {
    actions.push({ label: "Tailor resume to close gaps", href: "/resume-generator", icon: FileText });
  }
  if (!hasJobsTracked) {
    actions.push({ label: "Start tracking job applications", href: "/job-tracker", icon: Briefcase });
  }
  if (!hasLinkedIn) {
    actions.push({ label: "Optimize your LinkedIn profile", href: "/linkedin-optimizer", icon: Globe });
  }
  if (hasJobsTracked && !hasMockInterview) {
    actions.push({ label: "Practice a mock interview", href: "/mock-interview", icon: Mic });
  }

  const visible = actions.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-semibold text-slate-200">Suggested Next Steps</h3>
      </div>
      <div className="space-y-2">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/60 p-3 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600/20">
                <Icon className="h-4 w-4 text-teal-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
