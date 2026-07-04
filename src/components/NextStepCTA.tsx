"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Target,
  BarChart3,
  Mail,
  Briefcase,
  Mic,
  Globe,
  Users,
  ArrowRight,
} from "lucide-react";
import { trackCtaClicked } from "@/lib/tracking";

type Tool =
  | "gap-analysis"
  | "resume-generator"
  | "ats-score"
  | "cover-letter"
  | "mock-interview"
  | "linkedin-optimizer"
  | "networking"
  | "job-tracker";

interface ToolConfig {
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: Record<Tool, ToolConfig> = {
  "gap-analysis": { label: "Gap Analysis", route: "/gap-analysis", icon: Target },
  "resume-generator": { label: "Resume Builder", route: "/resume-generator", icon: FileText },
  "ats-score": { label: "ATS Score Checker", route: "/ats-score", icon: BarChart3 },
  "cover-letter": { label: "Cover Letter Generator", route: "/cover-letter", icon: Mail },
  "mock-interview": { label: "Mock Interview", route: "/mock-interview", icon: Mic },
  "linkedin-optimizer": { label: "LinkedIn Optimizer", route: "/linkedin-optimizer", icon: Globe },
  "networking": { label: "Networking CRM", route: "/networking", icon: Users },
  "job-tracker": { label: "Job Tracker", route: "/job-tracker", icon: Briefcase },
};

const BRIDGE_MAP: Record<Tool, { tool: Tool; copy: string }[]> = {
  "gap-analysis": [
    { tool: "resume-generator", copy: "Tailor your resume to close these gaps" },
  ],
  "resume-generator": [
    { tool: "ats-score", copy: "Check ATS compatibility" },
    { tool: "cover-letter", copy: "Generate a matching cover letter" },
  ],
  "ats-score": [
    { tool: "resume-generator", copy: "Fix issues and re-check" },
  ],
  "cover-letter": [
    { tool: "job-tracker", copy: "Track this application" },
  ],
  "mock-interview": [
    { tool: "gap-analysis", copy: "Review your gap areas" },
  ],
  "linkedin-optimizer": [
    { tool: "job-tracker", copy: "Find jobs matching your profile" },
  ],
  "networking": [
    { tool: "mock-interview", copy: "Prepare for the conversation" },
  ],
  "job-tracker": [],
};

interface NextStepCTAProps {
  fromTool: Tool;
  suggestedTool?: Tool;
  prefilledData?: Record<string, string>;
}

export default function NextStepCTA({
  fromTool,
  suggestedTool,
  prefilledData,
}: NextStepCTAProps) {
  const bridges = suggestedTool
    ? [
        {
          tool: suggestedTool,
          copy:
            BRIDGE_MAP[fromTool]?.find((b) => b.tool === suggestedTool)?.copy ??
            `Continue to ${TOOLS[suggestedTool].label}`,
        },
      ]
    : BRIDGE_MAP[fromTool] ?? [];

  if (bridges.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 w-full mt-8">
      {bridges.map(({ tool, copy }) => {
        const config = TOOLS[tool];
        const Icon = config.icon;
        const params = prefilledData
          ? "?" + new URLSearchParams(prefilledData).toString()
          : "";
        const href = `${config.route}${params}`;

        return (
          <motion.div
            key={tool}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href={href}
              onClick={() =>
                trackCtaClicked({
                  cta_text: copy,
                  cta_location: `next_step_${fromTool}`,
                  destination: config.route,
                })
              }
              className="group flex items-center gap-4 w-full rounded-2xl bg-gradient-to-r from-teal-600/90 to-cyan-600/90 hover:from-teal-500 hover:to-cyan-500 p-4 sm:p-5 text-white shadow-lg shadow-teal-900/20 transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-teal-100">Next step</p>
                <p className="text-base font-semibold truncate">{copy}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
