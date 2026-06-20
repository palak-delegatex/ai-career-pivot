"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

const DISMISS_KEY = "aicareerpivot:getting-started-dismissed";
const GOAL_KEY = "aicareerpivot:weekly-goal-target";

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  completed: boolean;
}

interface GettingStartedChecklistProps {
  email: string;
  hasCompletedMilestone: boolean;
}

export default function GettingStartedChecklist({
  email,
  hasCompletedMilestone,
}: GettingStartedChecklistProps) {
  const [dismissed, setDismissed] = useState(true);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [hasScoreHistory, setHasScoreHistory] = useState<boolean | null>(null);
  const [hasWeeklyGoal, setHasWeeklyGoal] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "true");
  }, []);

  useEffect(() => {
    setHasResume(true);

    const goalTarget = localStorage.getItem(GOAL_KEY);
    setHasWeeklyGoal(!!goalTarget && Number(goalTarget) > 0);

    async function fetchChecks() {
      try {
        const [jobsRes, scoresRes] = await Promise.all([
          fetch(`/api/job-tracker?email=${encodeURIComponent(email)}`),
          fetch(`/api/resume-versions?email=${encodeURIComponent(email)}`),
        ]);
        if (jobsRes.ok) {
          const data = await jobsRes.json();
          const jobs = data.jobs ?? data;
          setJobCount(Array.isArray(jobs) ? jobs.length : 0);
        } else {
          setJobCount(0);
        }
        if (scoresRes.ok) {
          const data = await scoresRes.json();
          const versions = data.versions ?? data;
          const hasScore = Array.isArray(versions)
            ? versions.some(
                (v: { ats_score?: number | null }) =>
                  v.ats_score !== null && v.ats_score !== undefined
              )
            : false;
          setHasScoreHistory(hasScore);
        } else {
          setHasScoreHistory(false);
        }
      } catch {
        setJobCount(0);
        setHasScoreHistory(false);
      }
    }

    fetchChecks();
  }, [email]);

  if (dismissed) return null;
  if (jobCount === null || hasScoreHistory === null) return null;

  const items: ChecklistItem[] = [
    {
      id: "resume",
      label: "Upload your resume",
      href: "/onboarding",
      completed: hasResume,
    },
    {
      id: "job",
      label: "Save your first job",
      href: "/job-tracker",
      completed: (jobCount ?? 0) > 0,
    },
    {
      id: "ats",
      label: "Run an ATS score check",
      href: "/ats-score",
      completed: hasScoreHistory ?? false,
    },
    {
      id: "goal",
      label: "Set a weekly application goal",
      href: "/dashboard",
      completed: hasWeeklyGoal,
    },
    {
      id: "milestone",
      label: "Complete your first milestone",
      href: "/dashboard",
      completed: hasCompletedMilestone,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progressPct = Math.round((completedCount / items.length) * 100);
  const canDismiss = completedCount >= 4;

  if (completedCount === items.length) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-900/20 to-slate-900 border border-teal-700/30 p-5 sm:p-6">
      <div className="h-1.5 w-full rounded-full bg-slate-700/60 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Getting Started</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount}/{items.length} complete
          </p>
        </div>
        {canDismiss && (
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <Checkbox
              checked={item.completed}
              disabled
              className={
                item.completed
                  ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-500"
                  : ""
              }
            />
            {item.completed ? (
              <span className="text-sm text-emerald-400 line-through">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm text-slate-300 hover:text-teal-400 transition-colors"
              >
                {item.label} &rarr;
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
