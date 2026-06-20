"use client";

import { useState, useEffect, useCallback } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { Minus, Plus } from "lucide-react";

const STORAGE_KEY = "aicareerpivot:weekly-goal-target";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

const ENCOURAGING_COPY: Record<string, string> = {
  zero: "Start your week strong!",
  partial: "Keep the momentum going!",
  almost: "Almost there — one more push!",
  done: "Goal reached — you're on fire!",
  over: "Above and beyond!",
};

function getCopy(applied: number, target: number): string {
  if (applied === 0) return ENCOURAGING_COPY.zero;
  if (applied >= target + 2) return ENCOURAGING_COPY.over;
  if (applied >= target) return ENCOURAGING_COPY.done;
  if (applied >= target - 1) return ENCOURAGING_COPY.almost;
  return ENCOURAGING_COPY.partial;
}

export default function WeeklyGoal({ email }: { email: string }) {
  const [target, setTarget] = useState(5);
  const [applied, setApplied] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (parsed >= 1 && parsed <= 20) setTarget(parsed);
    }
  }, []);

  const loadWeeklyCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/job-tracker?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const { jobs } = await res.json();
      const weekStart = getWeekStart();
      const count = (jobs as { stage: string; created_at: string }[]).filter((j) => {
        if (j.stage === "saved") return false;
        return j.created_at >= weekStart;
      }).length;
      setApplied(count);
    } finally {
      setLoaded(true);
    }
  }, [email]);

  useEffect(() => { loadWeeklyCount(); }, [loadWeeklyCount]);

  function adjustTarget(delta: number) {
    setTarget((prev) => {
      const next = Math.max(1, Math.min(20, prev + delta));
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  const percent = Math.min(100, Math.round((applied / target) * 100));

  if (!loaded) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Weekly Goal</h3>
      <ScoreRing score={percent} animated={true} label="Applied" size={96} />
      <p className="mt-3 text-sm text-slate-200 font-medium">
        {applied} of {target} this week
      </p>
      <p className="text-xs text-slate-400 mt-1">{getCopy(applied, target)}</p>
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => adjustTarget(-1)}
          disabled={target <= 1}
          className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-30"
          aria-label="Decrease goal"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-slate-500">Target: {target}/week</span>
        <button
          onClick={() => adjustTarget(1)}
          disabled={target >= 20}
          className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-30"
          aria-label="Increase goal"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
