"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GeneratedRoadmap, RoadmapIntake, RoadmapPhase } from "@/lib/intake";

function readSession<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default function RoadmapResultPage() {
  const router = useRouter();
  const [roadmap] = useState<GeneratedRoadmap | null>(() =>
    readSession<GeneratedRoadmap>("roadmap_result")
  );
  const [intake] = useState<RoadmapIntake | null>(() =>
    readSession<RoadmapIntake>("roadmap_intake")
  );

  useEffect(() => {
    if (!roadmap) {
      router.replace("/onboarding/roadmap");
    }
  }, [roadmap, router]);

  if (!roadmap) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Screen-only action bar */}
      <div className="no-print sticky top-0 z-20 backdrop-blur bg-slate-900/80 border-b border-slate-700/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/onboarding/roadmap"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            ← Edit inputs
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <article id="roadmap-print" className="max-w-4xl mx-auto px-6 py-12 print:py-0 print:px-0">
        <header className="mb-10 print:mb-6">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-2 print:text-teal-700">
            Your Career Pivot Roadmap
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 print:text-3xl print:text-black">
            {roadmap.headlineTargetRole}
          </h1>
          <p className="text-slate-400 text-lg print:text-slate-700">
            {roadmap.headlineTargetIndustry} · {roadmap.overallTimeframe}
          </p>
          {intake && (
            <p className="text-slate-500 text-sm mt-2 print:text-slate-600">
              For {intake.email} · From {intake.currentTitle} ({intake.currentIndustry})
            </p>
          )}
        </header>

        <Section title="Executive Summary">
          <p className="leading-relaxed text-slate-200 whitespace-pre-wrap print:text-black">
            {roadmap.executiveSummary}
          </p>
        </Section>

        <Section title="Risk Assessment">
          <p className="leading-relaxed text-slate-200 whitespace-pre-wrap print:text-black">
            {roadmap.riskAssessment}
          </p>
        </Section>

        <PhaseBlock label="0–6 Months" phase={roadmap.sixMonth} accent="emerald" />
        <PhaseBlock label="6–12 Months" phase={roadmap.oneYear} accent="teal" />
        <PhaseBlock
          label="1–2 Years"
          phase={roadmap.twoYear}
          accent="cyan"
          showSalary
        />

        <Section title="If the pivot stalls">
          <p className="leading-relaxed text-slate-200 whitespace-pre-wrap print:text-black">
            {roadmap.contingencyNotes}
          </p>
        </Section>

        <footer className="mt-12 pt-6 border-t border-slate-700/60 text-xs text-slate-500 print:text-slate-600">
          Generated {new Date(roadmap.generatedAt).toLocaleString()} by AICareerPivot.
          This roadmap is personalized to the inputs you provided. Re-run with new inputs as your situation evolves.
        </footer>
      </article>

      <div className="no-print max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-800/40 border border-teal-700/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Want this saved and tracked?</h3>
          <p className="text-slate-400 mb-4 text-sm">
            Subscribe to keep your roadmap, get progress check-ins, and unlock weekly action plans.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors"
          >
            See pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 print:mb-5 break-inside-avoid">
      <h2 className="text-xl font-bold text-teal-400 mb-3 print:text-teal-800 print:text-lg">{title}</h2>
      {children}
    </section>
  );
}

function PhaseBlock({
  label,
  phase,
  accent,
  showSalary,
}: {
  label: string;
  phase: RoadmapPhase;
  accent: "emerald" | "teal" | "cyan";
  showSalary?: boolean;
}) {
  const accentText: Record<typeof accent, string> = {
    emerald: "text-emerald-400 print:text-emerald-800",
    teal: "text-teal-400 print:text-teal-800",
    cyan: "text-cyan-400 print:text-cyan-800",
  };
  const accentBorder: Record<typeof accent, string> = {
    emerald: "border-emerald-700/40",
    teal: "border-teal-700/40",
    cyan: "border-cyan-700/40",
  };

  return (
    <section
      className={`mb-8 print:mb-5 border ${accentBorder[accent]} rounded-2xl p-6 bg-slate-800/40 break-inside-avoid print:bg-white print:border-slate-300`}
    >
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h2 className={`text-2xl font-bold ${accentText[accent]} print:text-xl`}>
          {label}: {phase.title}
        </h2>
      </div>
      <p className="text-slate-300 leading-relaxed mb-5 print:text-black">{phase.summary}</p>

      <div className="grid md:grid-cols-2 gap-5 print:grid-cols-2">
        <SkillList title="Skills to learn" items={phase.skillsToLearn} />
        <SkillList title="Certifications" items={phase.certificationsToPursue} />
        <SkillList title="Networking targets" items={phase.networkingTargets} />
        <SkillList title="Milestones" items={phase.milestones} />
      </div>

      {phase.incomeBridgeStrategies && phase.incomeBridgeStrategies.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-slate-900/40 border border-slate-700/60 print:bg-slate-50 print:border-slate-300">
          <h4 className="text-sm font-bold text-amber-400 mb-2 print:text-amber-800">
            Income bridge strategies
          </h4>
          <ul className="space-y-1">
            {phase.incomeBridgeStrategies.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2 print:text-black">
                <span className="text-amber-500 print:text-amber-800">$</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSalary && (phase.targetRole || phase.expectedSalaryRange || phase.growthTrajectory) && (
        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
          {phase.targetRole && (
            <Pill label="Target role" value={phase.targetRole} />
          )}
          {phase.expectedSalaryRange && (
            <Pill label="Expected salary" value={phase.expectedSalaryRange} />
          )}
          {phase.growthTrajectory && (
            <Pill label="Growth path" value={phase.growthTrajectory} />
          )}
        </div>
      )}
    </section>
  );
}

function SkillList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-200 mb-2 print:text-black">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2 print:text-black">
            <span className="text-teal-500 mt-0.5 shrink-0 print:text-teal-800">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 print:bg-slate-50 print:border-slate-300">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 print:text-slate-600">{label}</p>
      <p className="text-slate-200 font-semibold print:text-black">{value}</p>
    </div>
  );
}
