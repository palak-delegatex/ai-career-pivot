"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { PivotPlan, UserProfile } from "@/lib/intake";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import DashboardHero from "@/components/DashboardHero";
import MilestoneChecklist from "@/components/MilestoneChecklist";
import type { PhaseData, MilestoneState } from "@/components/MilestoneChecklist";
import NextActionsWidget from "@/components/NextActionsWidget";
import JobBoard from "@/components/JobBoard";

interface Report {
  id: string;
  email: string;
  profile: UserProfile;
  plans: PivotPlan[];
  created_at: string;
}

interface MilestoneProgressRow {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

function progressKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function buildPhases(plan: PivotPlan): PhaseData[] {
  return [
    {
      key: "6mo",
      label: "6 Months",
      milestones: plan.sixMonthMilestones ?? [],
      color: "emerald",
    },
    {
      key: "1yr",
      label: "1 Year",
      milestones: plan.oneYearMilestones ?? [],
      color: "teal",
    },
    {
      key: "2yr",
      label: "2 Years",
      milestones: plan.twoYearMilestones ?? [],
      color: "cyan",
    },
  ];
}

function computeScheduleStatus(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>,
  reportCreatedAt: string
): "on-track" | "behind-schedule" | "at-risk" {
  const total = phases.reduce((s, p) => s + p.milestones.length, 0);
  if (total === 0) return "on-track";

  let completed = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      if (statuses.get(progressKey(phase.key, i))?.completed) completed++;
    }
  }

  const pct = completed / total;
  if (pct >= 1) return "on-track";

  const created = new Date(reportCreatedAt).getTime();
  const elapsedMonths = (Date.now() - created) / (1000 * 60 * 60 * 24 * 30);

  if (elapsedMonths < 0.5) return "on-track";

  const expectedPct = Math.min(elapsedMonths / 24, 1);
  if (pct >= expectedPct * 0.7) return "on-track";
  if (pct >= expectedPct * 0.4) return "behind-schedule";
  return "at-risk";
}

function getNextActions(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>,
  plan: PivotPlan
) {
  const items: {
    phase: string;
    phaseLabel: string;
    milestone: string;
    milestoneIndex: number;
    actions: { title: string; instruction: string; timeEstimate: string }[];
  }[] = [];

  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      const key = progressKey(phase.key, i);
      const state = statuses.get(key);
      if (!state || !state.completed) {
        items.push({
          phase: phase.key,
          phaseLabel: phase.label,
          milestone: phase.milestones[i],
          milestoneIndex: i,
          actions:
            items.length === 0 && plan.weekOneActions
              ? plan.weekOneActions.slice(0, 2).map((a) => ({
                  title: a.title,
                  instruction: a.instruction,
                  timeEstimate: a.timeEstimate,
                }))
              : [],
        });
      }
      if (items.length >= 3) break;
    }
    if (items.length >= 3) break;
  }

  return items;
}

export default function DashboardClient() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [milestoneStatuses, setMilestoneStatuses] = useState<
    Map<string, MilestoneState>
  >(new Map());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Unable to determine your email. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setReports(data.reports);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const activeReport = reports?.[0];
  const activePlan = activeReport?.plans[selectedPlanIndex];

  const loadProgress = useCallback(async () => {
    if (!activeReport) return;
    try {
      const res = await fetch(
        `/api/roadmap/progress?reportId=${activeReport.id}&planIndex=${selectedPlanIndex}`
      );
      if (!res.ok) return;
      const { progress: items } = (await res.json()) as {
        progress: MilestoneProgressRow[];
      };
      const map = new Map<string, MilestoneState>();
      for (const item of items) {
        map.set(progressKey(item.phase, item.milestone_index), {
          completed: item.completed,
          notes: item.notes,
          completed_at: item.completed_at,
        });
      }
      setMilestoneStatuses(map);
    } finally {
      setProgressLoaded(true);
    }
  }, [activeReport, selectedPlanIndex]);

  useEffect(() => {
    if (activeReport) {
      setProgressLoaded(false);
      loadProgress();
    }
  }, [activeReport, loadProgress]);

  async function handleToggle(phaseKey: string, milestoneIndex: number) {
    if (!activeReport) return;
    const key = progressKey(phaseKey, milestoneIndex);
    const current = milestoneStatuses.get(key);
    const currentCompleted = current?.completed ?? false;
    const hasRow = current !== undefined;

    // Cycle: not-started → in-progress → completed → not-started
    let nextState: "not-started" | "in-progress" | "completed";
    if (!hasRow) {
      nextState = "in-progress";
    } else if (!currentCompleted) {
      nextState = "completed";
    } else {
      nextState = "not-started";
    }

    setSavingKey(key);
    setMilestoneStatuses((prev) => {
      const updated = new Map(prev);
      if (nextState === "not-started") {
        updated.delete(key);
      } else {
        updated.set(key, {
          completed: nextState === "completed",
          notes: current?.notes ?? null,
          completed_at: nextState === "completed" ? new Date().toISOString() : null,
        });
      }
      return updated;
    });

    try {
      if (nextState === "not-started") {
        await fetch(
          `/api/roadmap/progress?reportId=${activeReport.id}&planIndex=${selectedPlanIndex}&phase=${phaseKey}&milestoneIndex=${milestoneIndex}`,
          { method: "DELETE" }
        );
      } else {
        await fetch("/api/roadmap/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: activeReport.id,
            planIndex: selectedPlanIndex,
            phase: phaseKey,
            milestoneIndex,
            completed: nextState === "completed",
            notes: current?.notes ?? null,
          }),
        });
      }
    } finally {
      setSavingKey(null);
    }
  }

  async function handleMarkDone(phaseKey: string, milestoneIndex: number) {
    if (!activeReport) return;
    const key = progressKey(phaseKey, milestoneIndex);
    const current = milestoneStatuses.get(key);

    setSavingKey(key);
    setMilestoneStatuses((prev) => {
      const updated = new Map(prev);
      updated.set(key, {
        completed: true,
        notes: current?.notes ?? null,
        completed_at: new Date().toISOString(),
      });
      return updated;
    });

    try {
      await fetch("/api/roadmap/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: activeReport.id,
          planIndex: selectedPlanIndex,
          phase: phaseKey,
          milestoneIndex,
          completed: true,
          notes: current?.notes ?? null,
        }),
      });
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-extrabold mb-2">Your Dashboard</h1>
        <p className="text-slate-400 mb-6">No roadmaps found yet.</p>
        <Link
          href="/pricing"
          className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block"
        >
          Get Your Career Pivot Report
        </Link>
      </main>
    );
  }

  const phases = activePlan ? buildPhases(activePlan) : [];
  const totalMilestones = phases.reduce(
    (s, p) => s + p.milestones.length,
    0
  );
  let completedMilestones = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      if (milestoneStatuses.get(progressKey(phase.key, i))?.completed)
        completedMilestones++;
    }
  }
  const completionPercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;
  const scheduleStatus = computeScheduleStatus(phases, milestoneStatuses, activeReport!.created_at);
  const nextActions = activePlan
    ? getNextActions(phases, milestoneStatuses, activePlan)
    : [];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">
        Your Dashboard
      </h1>
      <p className="text-slate-400 text-center mb-8">
        Track your career pivot progress
      </p>

      {activeReport && activeReport.plans.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {activeReport.plans.map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelectedPlanIndex(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                i === selectedPlanIndex
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {plan.targetRole}
            </button>
          ))}
        </div>
      )}

      {activePlan && (
        <div className="space-y-6">
          <DashboardHero
            completionPercent={completionPercent}
            status={scheduleStatus}
            totalMilestones={totalMilestones}
            completedMilestones={completedMilestones}
            remainingMilestones={totalMilestones - completedMilestones}
            targetRole={activePlan.targetRole}
          />

          {progressLoaded && (
            <>
              <NextActionsWidget items={nextActions} onMarkDone={handleMarkDone} />

              <MilestoneChecklist
                phases={phases}
                statuses={milestoneStatuses}
                onToggle={handleToggle}
                savingKey={savingKey}
              />
            </>
          )}

          <JobBoard targetRole={activePlan.targetRole} />

          <div className="pt-4 border-t border-slate-700/50">
            <Link
              href={`/report/${activeReport!.id}`}
              className="block w-full text-center px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 font-semibold text-sm transition-all shadow-lg shadow-teal-900/30"
            >
              View Full Report
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
