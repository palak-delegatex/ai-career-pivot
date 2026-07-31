/**
 * SampleOutputCards (AIC-893 — replaces the removed CaseStudyCards).
 *
 * Labeled, illustrative product walkthroughs: each card shows the STRUCTURE of
 * the artifact the product generates for an example role transition — not a real
 * person and not an outcome claim. Every card carries a SampleOutputBadge so it
 * can never be read as a testimonial (AIC-889 / FTC guardrail).
 *
 * The example roles are generic, common pivots; the "roadmap" content describes
 * what the tool produces (gaps → phased plan), never a promised result.
 */
import { ArrowRight } from "lucide-react";
import SampleOutputBadge from "@/components/SampleOutputBadge";

interface SampleWalkthrough {
  from: string;
  to: string;
  gaps: string[];
  firstMove: string;
}

// Illustrative only — these describe the shape of the generated plan, not any
// user's actual journey or result.
const SAMPLES: SampleWalkthrough[] = [
  {
    from: "Marketing Manager",
    to: "AI Product Marketing",
    gaps: ["Prompt-driven content workflows", "Analytics for AI features", "Positioning AI products"],
    firstMove: "Ship one AI-assisted campaign and document the workflow.",
  },
  {
    from: "Operations Analyst",
    to: "AI Operations / Automation",
    gaps: ["Workflow automation tools", "LLM-in-the-loop process design", "Measuring automation ROI"],
    firstMove: "Automate one recurring report with an AI tool this month.",
  },
  {
    from: "Software Engineer",
    to: "AI Application Engineer",
    gaps: ["LLM app patterns", "Retrieval & eval basics", "Shipping with an agent SDK"],
    firstMove: "Build a small retrieval-backed feature and evaluate it.",
  },
];

export default function SampleOutputCards({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-5 md:grid-cols-3 ${className}`}>
      {SAMPLES.map((s) => (
        <div
          key={`${s.from}-${s.to}`}
          className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        >
          <SampleOutputBadge className="mb-4 self-start" />
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-300">{s.from}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
            <span className="font-semibold text-white">{s.to}</span>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Skill gaps the plan surfaces
          </p>
          <ul className="mb-4 space-y-1.5">
            {s.gaps.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="mt-0.5 shrink-0 text-teal-400">•</span>
                {g}
              </li>
            ))}
          </ul>
          <div className="mt-auto rounded-lg border border-teal-800/40 bg-teal-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Example first move</p>
            <p className="mt-1 text-sm text-slate-300">{s.firstMove}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
