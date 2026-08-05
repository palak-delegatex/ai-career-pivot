"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import type { GamifiedAtsPayload } from "@/lib/gamified-ats-payload";
import { trackAtsScoreViewed, trackAtsFixToggled, trackAtsScoreMilestone, trackAtsScoreClimbed } from "@/lib/tracking";

// Surface 2: Live gamified ATS score + "Fix This" checklist (AIC-879 / design
// AIC-873, engine AIC-874).
//
// Rezi/Enhancv's engagement loop: a live 0-100 meter plus a checklist where each
// item shows the exact points it's worth. Every number comes from the pure,
// deterministic `buildGamifiedAtsScore` engine (real breakdown → per-item point
// deltas); checking a fix is pure client-side arithmetic over those deltas, so
// the meter updates live with no round-trip and nothing is fabricated.

const STORAGE_KEY = "ats_fix_checklist";
const MILESTONES = [60, 80, 100] as const;

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

// Score-band → semantic colors (same thresholds as ScoreRing).
function bandBadge(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-700/40";
  if (score >= 60) return "text-teal-400 border-teal-700/40";
  if (score >= 40) return "text-amber-400 border-amber-700/40";
  return "text-red-400 border-red-700/40";
}

function bandBar(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
}

// Highest milestone at or below a score (0 if none crossed yet).
function bandFloor(score: number): number {
  let band = 0;
  for (const m of MILESTONES) if (score >= m) band = m;
  return band;
}

// Category-standard ATS pass threshold (Jobscan/Enhancv/Careerflow all cite 75+).
// A stated industry heuristic, NOT a fabricated user metric — see AIC-862.
const ATS_TARGET_THRESHOLD = 75;

// Bridge the completion state into the conversion surface (AIC-883 spec 2):
// smooth-scroll to the locked paid-report preview rendered by FreeResultsClient.
function scrollToLockedReport() {
  document
    .getElementById("locked-report-preview")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function GamifiedATSScore({ payload }: { payload: GamifiedAtsPayload }) {
  const { gamified, categories, targetRole } = payload;

  // Open items (the actionable fixes), highest-value first — the engine already
  // returns them sorted, but re-filter defensively.
  const fixes = useMemo(() => gamified.items.filter((i) => !i.done), [gamified.items]);

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [animated, setAnimated] = useState(false);
  const prevBand = useRef(bandFloor(gamified.score));
  const viewedTracked = useRef(false);

  // Restore prior check-off state (survives page navigation; free tier, no acct).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        // Reading a browser-only store on mount (SSR-safe) — the codebase's
        // established pattern (cf. FreeResultsClient's quickcheck_role read).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(ids)) setChecked(new Set(ids.filter((x) => typeof x === "string")));
      }
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
    // Kick the mount fill animation on the next frame (0 → score).
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (viewedTracked.current) return;
    viewedTracked.current = true;
    trackAtsScoreViewed({ score: gamified.score, target_role: targetRole });
  }, [gamified.score, targetRole]);

  // Live score = base + points from the fixes the user has checked off, capped
  // at 100 (mirrors the engine's headroom clamp).
  const gainedPoints = fixes.reduce((sum, f) => (checked.has(f.id) ? sum + f.pointDelta : sum), 0);
  const liveScore = Math.min(100, gamified.score + gainedPoints);
  const targetScore = Math.min(100, gamified.score + gamified.headroom);
  const allDone = fixes.length > 0 && fixes.every((f) => checked.has(f.id));

  function toggle(id: string, points: number, category: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      const isChecking = !next.has(id);
      if (isChecking) next.add(id);
      else next.delete(id);

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* non-fatal */
      }

      const prevGained = fixes.reduce((s, f) => (prev.has(f.id) ? s + f.pointDelta : s), 0);
      const fromScore = Math.min(100, gamified.score + prevGained);
      const newGained = fixes.reduce((s, f) => (next.has(f.id) ? s + f.pointDelta : s), 0);
      const newScore = Math.min(100, gamified.score + newGained);
      trackAtsFixToggled({ fix_id: id, category, points, new_score: newScore, checked: isChecking });

      // The measurement backbone (AIC-884 item 1): fire only when applying a fix
      // actually raised the live score. Un-checks go to `ats_fix_toggled` only —
      // `ats_score_climbed` is the clean upward-transition signal the free→paid
      // gamification analysis reads.
      if (isChecking && newScore > fromScore) {
        trackAtsScoreClimbed({ from: fromScore, to: newScore, delta: newScore - fromScore, trigger: id });
      }

      // Milestone pop on an upward band crossing.
      const newBand = bandFloor(newScore);
      if (newBand > prevBand.current) {
        trackAtsScoreMilestone({ band: `${newBand}`, score: newScore });
      }
      prevBand.current = newBand;

      return next;
    });
  }

  return (
    <section className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Your ATS Compatibility</h2>
        <p className="text-sm text-slate-400">
          How your résumé scores against ATS screening for {targetRole}
        </p>
      </div>

      {/* Ring + category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center mb-6">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing
            score={liveScore}
            animated={animated}
            label="ATS Score"
            size={112}
            target={targetScore}
          />
          <span
            className={`text-xs font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${bandBadge(liveScore)}`}
          >
            {scoreLabel(liveScore)}
          </span>
          <span className="text-[10px] text-slate-500 text-center max-w-[9rem] leading-tight">
            ATS target for {targetRole}: {ATS_TARGET_THRESHOLD}+
          </span>
        </div>

        <div className="space-y-3 w-full">
          {categories.map((c) => (
            <div key={c.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-slate-300">{c.name}</span>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">{Math.round(c.score)}</span>
              </div>
              <div
                className="relative h-2 w-full rounded-full bg-slate-700 overflow-hidden"
                role="meter"
                aria-valuenow={Math.round(c.score)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.name}: ${Math.round(c.score)} out of 100`}
              >
                {/* 75% target marker (AIC-883 spec 4) — matches the ring target.
                    The fill (positioned, rendered after) paints over it once the
                    category reaches 75%, visually confirming the pass. */}
                <div
                  className="absolute left-[75%] top-0 h-full w-px bg-slate-500/50"
                  aria-hidden="true"
                />
                <div
                  className={`relative h-2 rounded-full ${bandBar(c.score)} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(3, Math.min(100, c.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fix-this checklist */}
      {fixes.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Fix these to raise your score
          </p>
          <ul className="space-y-2">
            {fixes.map((f) => {
              const isChecked = checked.has(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    aria-label={`${f.fix ?? f.label} — worth ${f.pointDelta} points`}
                    onClick={() => toggle(f.id, f.pointDelta, f.category)}
                    className="w-full min-h-11 text-left rounded-lg bg-slate-800/30 border border-slate-700/30 p-3 flex items-start gap-3 hover:border-slate-600/50 transition-colors"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isChecked ? `${bandBar(liveScore)} border-transparent` : "border-slate-600"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 text-slate-900" strokeWidth={3} aria-hidden="true" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm ${isChecked ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {f.fix ?? f.label}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                        {f.category}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400 shrink-0 tabular-nums">+{f.pointDelta} pts</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-slate-400 mt-4" aria-live="polite">
            {allDone ? (
              <span className="text-emerald-400 font-semibold">
                Your résumé is ATS-optimized! 🎉{" "}
                <button
                  type="button"
                  onClick={scrollToLockedReport}
                  className="text-teal-400 hover:text-teal-300 underline underline-offset-2 font-semibold"
                >
                  See the full breakdown below ↓
                </button>
              </span>
            ) : (
              <>
                Potential score:{" "}
                <span className="font-semibold text-slate-200 tabular-nums">{liveScore}</span> →{" "}
                <span className="font-semibold text-emerald-400 tabular-nums">{targetScore}</span>
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
