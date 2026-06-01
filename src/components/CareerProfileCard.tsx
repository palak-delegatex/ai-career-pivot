"use client";

import type { ValuesAssessment } from "@/lib/intake";

const VALUE_LABELS: Record<string, string> = {
  compensation: "Compensation",
  balance: "Work-Life Balance",
  creativity: "Creativity",
  impact: "Social Impact",
  learning: "Continuous Learning",
  status: "Status & Recognition",
  autonomy: "Autonomy",
  stability: "Job Stability",
};

const WORK_STYLE_LABELS: Record<string, string> = {
  independent: "Independent Worker",
  collaborative: "Team Collaborator",
  leading: "Natural Leader",
  supporting: "Team Enabler",
};

const ENERGY_LABELS: Record<string, { left: string; right: string }> = {
  social: { left: "Introvert", right: "Extrovert" },
  scope: { left: "Specialist", right: "Generalist" },
  risk: { left: "Risk-Averse", right: "Risk-Seeking" },
  focus: { left: "Process", right: "Outcome" },
};

interface CareerProfileCardProps {
  assessment: ValuesAssessment;
  onRetake?: () => void;
}

export default function CareerProfileCard({ assessment, onRetake }: CareerProfileCardProps) {
  const riskVal = assessment.energyProfile.risk ?? 50;
  const riskLabel = riskVal < 35 ? "Conservative" : riskVal > 65 ? "Bold" : "Balanced";

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold text-teal-400 mb-4">Your Career Profile</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Work Style</p>
          <p className="text-white font-medium text-sm">
            {WORK_STYLE_LABELS[assessment.workStyle] || assessment.workStyle}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Risk Profile</p>
          <p className="text-white font-medium text-sm">{riskLabel}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Top Values</p>
        <div className="flex flex-wrap gap-2">
          {assessment.topValues.map((v) => (
            <span
              key={v}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {VALUE_LABELS[v] || v}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Energy Profile</p>
        <div className="space-y-3">
          {Object.entries(assessment.energyProfile).map(([key, val]) => {
            const labels = ENERGY_LABELS[key];
            if (!labels) return null;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{labels.left}</span>
                  <span>{labels.right}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--muted)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${val}%`,
                      backgroundColor: "var(--primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {assessment.dealbreakers.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Dealbreakers</p>
          <p className="text-slate-300 text-sm">
            {assessment.dealbreakers
              .map((d) => d.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
              .join(" · ")}
          </p>
        </div>
      )}

      {onRetake && (
        <button
          onClick={onRetake}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          Retake Assessment
        </button>
      )}
    </div>
  );
}
