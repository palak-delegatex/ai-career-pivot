"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PivotPlan, UserProfile } from "@/lib/intake";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import DashboardHero from "@/components/DashboardHero";
import MilestoneChecklist from "@/components/MilestoneChecklist";
import type { PhaseData, MilestoneState } from "@/components/MilestoneChecklist";
import NextActionsWidget from "@/components/NextActionsWidget";
import JobBoard from "@/components/JobBoard";
import MomentumCard from "@/components/MomentumCard";
import StreakCalendar from "@/components/StreakCalendar";
import PhaseProgressCards from "@/components/PhaseProgressCards";
import CompletionBadges from "@/components/CompletionBadges";
import { BADGE_DEFINITIONS } from "@/components/CompletionBadges";
import ShareableProgressCard from "@/components/ShareableProgressCard";
import PhaseCompletionCelebration from "@/components/PhaseCompletionCelebration";
import AchievementCelebration from "@/components/AchievementCelebration";
import TransitionStageTracker from "@/components/TransitionStageTracker";
import WeeklySummaryWidget from "@/components/WeeklySummaryWidget";
import DocumentsCard from "@/components/DocumentsCard";
import GapAnalysisTab from "@/components/GapAnalysisTab";
import SalaryNegotiationTab from "@/components/SalaryNegotiationTab";
import NetworkingCRM from "@/components/NetworkingCRM";
import ResumeVersionsTab from "@/components/ResumeVersionsTab";
import QuickActionsCard from "@/components/QuickActionsCard";
import ToolsGrid from "@/components/ToolsGrid";
import UpgradePrompt from "@/components/UpgradePrompt";
import PlanBadge from "@/components/PlanBadge";
import UsageMeterStrip from "@/components/UsageMeterStrip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { UserPlanResponse } from "@/app/api/user-plan/route";

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

function computeStreakData(statuses: Map<string, MilestoneState>) {
  const completionDates: string[] = [];
  for (const [, state] of statuses) {
    if (state.completed && state.completed_at) {
      completionDates.push(state.completed_at.slice(0, 10));
    }
  }

  const uniqueDays = new Set(completionDates);
  const sortedDays = [...uniqueDays].sort().reverse();

  let streakDays = 0;
  const today = new Date();
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (uniqueDays.has(dateStr)) {
      streakDays++;
    } else if (i > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { streakDays, activeDays: uniqueDays, sortedDays };
}

function computeWeeklyActivity(statuses: Map<string, MilestoneState>): number[] {
  const counts = new Array(7).fill(0);
  const now = new Date();
  for (const [, state] of statuses) {
    if (state.completed && state.completed_at) {
      const completedDate = new Date(state.completed_at);
      const diffDays = Math.floor(
        (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < 7) {
        counts[6 - diffDays]++;
      }
    }
  }
  return counts;
}

function computeMonthlyStats(statuses: Map<string, MilestoneState>) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let thisMonthCount = 0;
  let lastMonthCount = 0;

  for (const [, state] of statuses) {
    if (state.completed && state.completed_at) {
      const d = new Date(state.completed_at);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        thisMonthCount++;
      }
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthCount++;
      }
    }
  }

  return { thisMonthCount, lastMonthCount };
}

function computePhaseForDay(
  statuses: Map<string, MilestoneState>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, state] of statuses) {
    if (state.completed && state.completed_at) {
      const day = state.completed_at.slice(0, 10);
      const phase = key.split(":")[0];
      map.set(day, phase);
    }
  }
  return map;
}

function computeCurrentPhaseLabel(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>
): string {
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      const state = statuses.get(progressKey(phase.key, i));
      if (!state || !state.completed) {
        return phase.label;
      }
    }
  }
  return phases[phases.length - 1]?.label ?? "";
}

function computeWeeklyStats(
  statuses: Map<string, MilestoneState>,
  weekOffset: number
): { milestonesCompleted: number; streakDays: number; applicationsCount: number; documentsGenerated: number; networkingTouches: number } {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() - weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let milestonesCompleted = 0;
  const activeDaysInWeek = new Set<string>();

  for (const [, state] of statuses) {
    if (state.completed && state.completed_at) {
      const d = new Date(state.completed_at);
      if (d >= weekStart && d < weekEnd) {
        milestonesCompleted++;
        activeDaysInWeek.add(d.toISOString().slice(0, 10));
      }
    }
  }

  return {
    milestonesCompleted,
    streakDays: activeDaysInWeek.size,
    applicationsCount: 0,
    documentsGenerated: 0,
    networkingTouches: 0,
  };
}

function computeEarnedBadges(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>,
  completionPercent: number,
  streakDays: number,
  completedMilestones: number
): Set<string> {
  const earned = new Set<string>();

  if (completedMilestones >= 1) earned.add("first_step");

  if (completedMilestones >= 5) earned.add("five_skills");

  if (completionPercent >= 50) earned.add("interview_unlocked");
  if (completionPercent >= 50) earned.add("halfway_there");

  for (const phase of phases) {
    let allDone = phase.milestones.length > 0;
    for (let i = 0; i < phase.milestones.length; i++) {
      if (!statuses.get(progressKey(phase.key, i))?.completed) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      earned.add("phase_complete");
      break;
    }
  }

  if (streakDays >= 7) earned.add("streak_master");
  if (completionPercent >= 100) earned.add("career_ready");

  const thisWeek = computeWeeklyStats(statuses, 0);
  if (thisWeek.milestonesCompleted >= 3) earned.add("momentum");

  return earned;
}

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [milestoneStatuses, setMilestoneStatuses] = useState<
    Map<string, MilestoneState>
  >(new Map());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedBadges, setSavedBadges] = useState<Set<string>>(new Set());
  const [celebratedPhases, setCelebratedPhases] = useState<Set<string>>(new Set());
  const [celebratingPhase, setCelebratingPhase] = useState<{ label: string; color: "emerald" | "teal" | "cyan" } | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<{ label: string; description: string; icon: React.ReactNode } | null>(null);
  const [celebratedBadges, setCelebratedBadges] = useState<Set<string>>(new Set());
  const [userPlan, setUserPlan] = useState<UserPlanResponse | null>(null);

  useEffect(() => {
    async function loadReports() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError(t('errorNoEmail'));
        setLoading(false);
        return;
      }

      try {
        const [reportsRes, planRes] = await Promise.all([
          fetch("/api/dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          }),
          fetch("/api/user-plan"),
        ]);
        if (!reportsRes.ok) throw new Error("Failed to fetch");
        const data = await reportsRes.json();
        setReports(data.reports);
        if (planRes.ok) {
          const planData: UserPlanResponse = await planRes.json();
          setUserPlan(planData);
        }
      } catch {
        setError(t('errorGeneric'));
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

  const loadBadges = useCallback(async () => {
    if (!activeReport) return;
    try {
      const res = await fetch(
        `/api/dashboard/badges?reportId=${activeReport.id}&planIndex=${selectedPlanIndex}`
      );
      if (!res.ok) return;
      const { badges } = await res.json();
      setSavedBadges(
        new Set((badges as { badge_key: string }[]).map((b) => b.badge_key))
      );
    } catch {}
  }, [activeReport, selectedPlanIndex]);

  useEffect(() => {
    if (activeReport) {
      setProgressLoaded(false);
      loadProgress();
      loadBadges();
    }
  }, [activeReport, loadProgress, loadBadges]);

  const saveBadge = useCallback(
    async (badgeKey: string) => {
      if (!activeReport) return;
      try {
        await fetch("/api/dashboard/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: activeReport.id,
            planIndex: selectedPlanIndex,
            badgeKey,
          }),
        });
      } catch {}
    },
    [activeReport, selectedPlanIndex]
  );

  async function handleToggle(phaseKey: string, milestoneIndex: number) {
    if (!activeReport) return;
    const key = progressKey(phaseKey, milestoneIndex);
    const current = milestoneStatuses.get(key);
    const currentCompleted = current?.completed ?? false;
    const hasRow = current !== undefined;

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">{t('loading')}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
        <h1 className="text-3xl font-extrabold mb-2">{t('title')}</h1>
        <p className="text-slate-400 mb-6">
          {t('emptyState.subtitle')}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/intake"
            className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block"
          >
            {t('emptyState.startCta')}
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 font-semibold text-sm transition-colors inline-block"
          >
            {t('emptyState.viewPlans')}
          </Link>
        </div>
      </main>
    );
  }

  const isFreeTier = userPlan?.plan === "free";

  const phases: PhaseData[] = activePlan ? [
    { key: "6mo", label: t('phase6mo'), milestones: activePlan.sixMonthMilestones ?? [], color: "emerald" },
    { key: "1yr", label: t('phase1yr'), milestones: activePlan.oneYearMilestones ?? [], color: "teal" },
    { key: "2yr", label: t('phase2yr'), milestones: activePlan.twoYearMilestones ?? [], color: "cyan" },
  ] : [];
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

  const { streakDays, activeDays } = computeStreakData(milestoneStatuses);
  const weeklyActivity = computeWeeklyActivity(milestoneStatuses);
  const { thisMonthCount, lastMonthCount } = computeMonthlyStats(milestoneStatuses);
  const phaseForDay = computePhaseForDay(milestoneStatuses);
  const currentPhaseLabel = computeCurrentPhaseLabel(phases, milestoneStatuses);

  const daysElapsed = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(activeReport!.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const earnedBadges = computeEarnedBadges(
    phases,
    milestoneStatuses,
    completionPercent,
    streakDays,
    completedMilestones
  );

  // Persist newly earned badges
  for (const badgeKey of earnedBadges) {
    if (!savedBadges.has(badgeKey)) {
      saveBadge(badgeKey);
      setSavedBadges((prev) => new Set([...prev, badgeKey]));
    }
  }

  const thisWeekStats = computeWeeklyStats(milestoneStatuses, 0);
  const lastWeekStats = computeWeeklyStats(milestoneStatuses, 1);

  // Detect newly completed phases for celebration
  for (const phase of phases) {
    if (phase.milestones.length === 0) continue;
    let allDone = true;
    for (let i = 0; i < phase.milestones.length; i++) {
      if (!milestoneStatuses.get(progressKey(phase.key, i))?.completed) {
        allDone = false;
        break;
      }
    }
    if (allDone && !celebratedPhases.has(phase.key) && !celebratingPhase) {
      setCelebratedPhases((prev) => new Set([...prev, phase.key]));
      setCelebratingPhase({ label: phase.label, color: phase.color });
      break;
    }
  }

  // Detect newly earned badges for celebration
  for (const badgeKey of earnedBadges) {
    if (!celebratedBadges.has(badgeKey) && !savedBadges.has(badgeKey) && !celebratingBadge && !celebratingPhase) {
      const def = BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
      if (def) {
        setCelebratedBadges((prev) => new Set([...prev, badgeKey]));
        setCelebratingBadge({ label: def.label, description: def.description, icon: def.icon });
        break;
      }
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center">
          {t('title')}
        </h1>
        {userPlan && <PlanBadge plan={userPlan.plan} />}
      </div>
      {activeReport && (
        <QuickActionsCard
          completionPercent={completionPercent}
          completedMilestones={completedMilestones}
          reportId={activeReport.id}
        />
      )}

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
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start mb-6 overflow-x-auto flex-nowrap" style={{ scrollbarWidth: "none" }}>
            <TabsTrigger value="overview" className="shrink-0">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="resumes" className="shrink-0">{t('tabs.resumes')}</TabsTrigger>
            <TabsTrigger value="gap-analysis" className="shrink-0">{t('tabs.gapAnalysis')}</TabsTrigger>
            <TabsTrigger value="negotiation" className="shrink-0">{t('tabs.negotiation')}</TabsTrigger>
            <TabsTrigger value="network" className="shrink-0">{t('tabs.network')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <DashboardHero
                completionPercent={completionPercent}
                status={scheduleStatus}
                totalMilestones={totalMilestones}
                completedMilestones={completedMilestones}
                remainingMilestones={totalMilestones - completedMilestones}
                targetRole={activePlan.targetRole}
                streakDays={streakDays}
                daysElapsed={daysElapsed}
                currentPhaseLabel={currentPhaseLabel}
              />

              {isFreeTier && <UsageMeterStrip />}

              {progressLoaded && (
                <>
                  {/* Career Transition Stage Progression */}
                  <TransitionStageTracker
                    completionPercent={completionPercent}
                  />

                  {/* 3-column grid: Momentum | Next Actions | Streak Calendar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MomentumCard
                      weeklyActivity={weeklyActivity}
                      monthlyCompleted={thisMonthCount}
                      previousMonthCompleted={lastMonthCount}
                    />
                    <NextActionsWidget items={nextActions} onMarkDone={handleMarkDone} />
                    <StreakCalendar
                      activeDays={activeDays}
                      phaseForDay={phaseForDay}
                      streakDays={streakDays}
                    />
                  </div>

                  {/* Phase Progress Cards */}
                  <PhaseProgressCards
                    phases={phases}
                    statuses={milestoneStatuses}
                    reportId={activeReport!.id}
                  />

                  {/* My Documents */}
                  <DocumentsCard email={activeReport!.email} />

                  {/* Gamification: Badges + Weekly Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CompletionBadges earnedBadges={earnedBadges} />
                    <WeeklySummaryWidget
                      thisWeek={thisWeekStats}
                      lastWeek={lastWeekStats}
                    />
                  </div>

                  {/* Shareable Progress Card */}
                  <ShareableProgressCard
                    currentRole={activeReport!.profile.currentTitle || t('currentRoleFallback')}
                    targetRole={activePlan.targetRole}
                    completionPercent={completionPercent}
                    completedMilestones={completedMilestones}
                    totalMilestones={totalMilestones}
                    streakDays={streakDays}
                    earnedBadgeCount={earnedBadges.size}
                    reportId={activeReport!.id}
                  />

                  <MilestoneChecklist
                    phases={phases}
                    statuses={milestoneStatuses}
                    onToggle={handleToggle}
                    savingKey={savingKey}
                  />
                </>
              )}

              <JobBoard
                targetRole={activePlan.targetRole}
                location={[activeReport.profile.location?.city, activeReport.profile.location?.country].filter(Boolean).join(", ") || undefined}
                userSkills={[...activeReport.profile.skills.slice(0, 10), ...activeReport.profile.transferableSkills.slice(0, 5)]}
                profile={activeReport.profile}
                plan={activePlan}
              />

              <ToolsGrid reportId={activeReport!.id} />

              {isFreeTier && (
                <UpgradePrompt
                  feature={t('featurePremiumTools')}
                  variant="banner"
                  price="$19"
                  location="dashboard_bottom"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="resumes">
            <ResumeVersionsTab
              email={activeReport!.email}
              profile={activeReport!.profile}
              plan={activePlan}
            />
          </TabsContent>

          <TabsContent value="gap-analysis">
            <GapAnalysisTab profile={activeReport!.profile} plan={activePlan} />
          </TabsContent>

          <TabsContent value="negotiation">
            {isFreeTier ? (
              <UpgradePrompt
                feature={t('featureSalaryNegotiation')}
                variant="gate"
                price="$19"
                message={t('upgradeNegotiation')}
                location="dashboard_negotiation_tab"
              />
            ) : (
              <SalaryNegotiationTab profile={activeReport!.profile} plan={activePlan} />
            )}
          </TabsContent>

          <TabsContent value="network">
            {isFreeTier ? (
              <UpgradePrompt
                feature={t('featureNetworkingTools')}
                variant="gate"
                price="$19"
                message={t('upgradeNetworking')}
                location="dashboard_network_tab"
              />
            ) : (
              <NetworkingCRM userEmail={activeReport!.email} />
            )}
          </TabsContent>
        </Tabs>
      )}

      {celebratingPhase && (
        <PhaseCompletionCelebration
          phaseLabel={celebratingPhase.label}
          phaseColor={celebratingPhase.color}
          onDismiss={() => setCelebratingPhase(null)}
        />
      )}

      {celebratingBadge && (
        <AchievementCelebration
          badgeLabel={celebratingBadge.label}
          badgeDescription={celebratingBadge.description}
          icon={celebratingBadge.icon}
          onDismiss={() => setCelebratingBadge(null)}
        />
      )}
    </main>
  );
}
