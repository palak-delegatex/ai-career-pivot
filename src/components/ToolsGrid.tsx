"use client";

import Link from "next/link";
import {
  FileText,
  Target,
  BarChart3,
  Mail,
  Briefcase,
  Mic,
  Globe,
  Users,
  MessageSquare,
  ClipboardCheck,
  Map,
  Search,
} from "lucide-react";

interface ToolCardData {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status?: string;
  isNew?: boolean;
}

const TOOLS: ToolCardData[] = [
  { name: "Career Roadmap", icon: Map, href: "/dashboard" },
  { name: "Resume Builder", icon: FileText, href: "/resume-generator" },
  { name: "Gap Analysis", icon: Target, href: "/gap-analysis" },
  { name: "ATS Score", icon: BarChart3, href: "/ats-score" },
  { name: "Cover Letter", icon: Mail, href: "/cover-letter" },
  { name: "Job Tracker", icon: Briefcase, href: "/job-tracker" },
  { name: "LinkedIn Optimizer", icon: Globe, href: "/linkedin-optimizer" },
  { name: "Mock Interview", icon: Mic, href: "/mock-interview" },
  { name: "Networking CRM", icon: Users, href: "/networking" },
  { name: "Career Coach", icon: MessageSquare, href: "/chat" },
  { name: "Assessment", icon: ClipboardCheck, href: "/assessment" },
  { name: "Skill Analysis", icon: Search, href: "/gap-analysis" },
];

interface ToolsGridProps {
  usageCounts?: Record<string, number>;
}

export default function ToolsGrid({ usageCounts = {} }: ToolsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const count = usageCounts[tool.href];
        const used = count !== undefined && count > 0;

        return (
          <Link
            key={tool.href + tool.name}
            href={tool.href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-800/40 p-4 text-center hover:border-teal-500/50 hover:bg-slate-800/70 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50 group-hover:bg-teal-600/20 transition-colors">
              <Icon className="h-5 w-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
            </div>
            <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
              {tool.name}
            </span>
            {used ? (
              <span className="text-[10px] text-slate-500">{count} uses</span>
            ) : (
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
