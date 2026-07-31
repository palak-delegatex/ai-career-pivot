/**
 * ProductJourney (AIC-893 — replaces the removed PivotJourneyTimeline).
 *
 * A 4-step "how the product actually works" timeline. Describes the product
 * pipeline (share context → AI analysis → phased roadmap → track & adjust), not
 * an invented person's journey. Pure product explanation — no proof claims.
 */
import { UploadCloud, Cpu, Map, LineChart } from "lucide-react";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Share your context",
    body: "Add your resume, LinkedIn, or just your situation. No account needed to start.",
  },
  {
    icon: Cpu,
    title: "AI analyzes your fit",
    body: "Claude maps your transferable skills against AI-adjacent roles and real labor-market data.",
  },
  {
    icon: Map,
    title: "Get a phased roadmap",
    body: "A structured 6-month / 1-year / 2-year plan with concrete milestones — built for your constraints.",
  },
  {
    icon: LineChart,
    title: "Track & adjust",
    body: "Follow the plan, mark progress, and refine as your situation changes.",
  },
];

export default function ProductJourney({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.title} className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                <Icon className="h-5 w-5 text-teal-400" aria-hidden />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mb-1.5 text-base font-bold text-white">{s.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{s.body}</p>
          </div>
        );
      })}
    </div>
  );
}
