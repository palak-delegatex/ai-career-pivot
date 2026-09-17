"use client";

// PivotMatcher — the interactive field + strengths → ranked target-role flow
// (AIC-1240). Pure client-side scoring (no API round-trip → instant results,
// Doherty Threshold). Free top-of-funnel discovery: NO email gate, login, or
// paywall anywhere in this flow (funnel frozen, AIC-1124).

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  SOURCE_FIELDS,
  SKILLS,
  MAX_SKILLS,
  emptyInput,
  rankRoles,
  DEMAND_LABEL,
  DIFFICULTY_LABEL,
  type FieldId,
  type SkillId,
  type MatcherInput,
  type RankedRole,
} from "@/lib/pivotMatcher";
import {
  trackPivotMatcherStarted,
  trackPivotMatcherCompleted,
  trackPivotMatcherRoleExpanded,
  trackPivotMatcherCtaClicked,
} from "@/lib/tracking";

function fitBand(fit: number): { text: string; bar: string } {
  if (fit >= 85) return { text: "text-emerald-400", bar: "bg-emerald-400" };
  if (fit >= 72) return { text: "text-teal-400", bar: "bg-teal-400" };
  return { text: "text-amber-400", bar: "bg-amber-400" };
}

export default function PivotMatcher() {
  const [input, setInput] = useState<MatcherInput>(emptyInput);
  const [results, setResults] = useState<RankedRole[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const startedFired = useRef(false);
  const sourceRef = useRef<string>("direct");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    sourceRef.current = params.get("source") || "direct";
  }, []);

  function recordFirstTouch() {
    if (!startedFired.current) {
      startedFired.current = true;
      trackPivotMatcherStarted({ source: sourceRef.current });
    }
  }

  function selectField(value: FieldId) {
    recordFirstTouch();
    setInput((prev) => ({ ...prev, field: value }));
  }

  function toggleSkill(value: SkillId) {
    recordFirstTouch();
    setInput((prev) => {
      const has = prev.skills.includes(value);
      let next = has ? prev.skills.filter((v) => v !== value) : [...prev.skills, value];
      if (!has && next.length > MAX_SKILLS) next = next.slice(next.length - MAX_SKILLS);
      return { ...prev, skills: next };
    });
  }

  const canSubmit = Boolean(input.field) && input.skills.length > 0;

  function showResults() {
    if (!canSubmit) return;
    const ranked = rankRoles(input);
    setResults(ranked);
    setExpanded(ranked[0]?.role.id ?? null);
    const top = ranked[0];
    trackPivotMatcherCompleted({
      field: input.field ?? "unspecified",
      skills: [...input.skills],
      top_role: top?.role.id ?? "",
      top_fit: top?.fit ?? 0,
    });
    // Scroll the results into view on the next frame.
    requestAnimationFrame(() => {
      document.getElementById("matcher-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function reset() {
    setResults(null);
    setInput(emptyInput());
    setExpanded(null);
  }

  function onExpand(r: RankedRole, rank: number) {
    const nextOpen = expanded === r.role.id ? null : r.role.id;
    setExpanded(nextOpen);
    if (nextOpen) {
      trackPivotMatcherRoleExpanded({ role_id: r.role.id, rank, fit: r.fit });
    }
  }

  // ── Results view ────────────────────────────────────────────────────────────
  if (results) {
    const topRoleName = results[0]?.role.name ?? "";
    return (
      <div id="matcher-results" className="bg-card border border-slate-700 rounded-2xl p-6 sm:p-8">
        <p className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-2">
          Your ranked AI-adjacent roles
        </p>
        <p className="text-slate-400 text-sm mb-6">
          Ranked by how well each role lines up with your background. Fit is a transparent
          alignment signal, not a prediction — use it to decide where to look first.
        </p>

        <ol className="space-y-4">
          {results.map((r, i) => {
            const band = fitBand(r.fit);
            const open = expanded === r.role.id;
            return (
              <li
                key={r.role.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onExpand(r, i + 1)}
                  aria-expanded={open}
                  className="w-full text-left p-5 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-base sm:text-lg font-semibold text-white">
                        {r.role.name}
                      </span>
                      <span className={`text-lg font-extrabold tabular-nums ${band.text}`}>
                        {r.fit}%
                      </span>
                    </span>
                    <span className="mt-2 block h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <span
                        className={`block h-full rounded-full ${band.bar} transition-all duration-700 ease-out motion-reduce:transition-none`}
                        style={{ width: `${r.fit}%` }}
                      />
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {DEMAND_LABEL[r.role.demand]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {DIFFICULTY_LABEL[r.role.difficulty]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {r.role.payLabel}
                      </span>
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex-shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {open && (
                  <div className="px-5 pb-5 pt-0 sm:pl-[4.5rem]">
                    <p className="text-sm text-slate-300 leading-relaxed">{r.role.blurb}</p>

                    {r.reasons.length > 0 && (
                      <ul className="mt-4 space-y-1.5">
                        {r.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-emerald-400 font-bold" aria-hidden="true">
                              ✓
                            </span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4">
                      <span className="text-xs text-teal-400 uppercase tracking-widest font-semibold">
                        Skills that carry over
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.role.transferable.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {r.role.payNote && (
                      <p className="mt-4 text-xs text-slate-500">
                        {r.role.payNote} —{" "}
                        <Link
                          href="/research/ai-career-pivots-2026"
                          className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
                        >
                          see the data
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Next steps — free discovery links, no paywall */}
        <section aria-labelledby="matcher-next" className="mt-8">
          <h3
            id="matcher-next"
            className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-4"
          >
            Next Steps
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/free?mode=upload&source=pivot-matcher"
              onClick={() =>
                trackPivotMatcherCtaClicked({ cta_target: "free", top_role: topRoleName })
              }
              className="block bg-slate-800 border border-slate-700 rounded-xl p-5 transition-colors hover:border-teal-500/40"
            >
              <div className="text-base font-semibold text-white mb-1">
                📄 Get your free AI career snapshot
              </div>
              <div className="text-sm text-slate-400">Upload your resume →</div>
            </Link>
            <Link
              href="/readiness?source=pivot-matcher"
              onClick={() =>
                trackPivotMatcherCtaClicked({ cta_target: "readiness", top_role: topRoleName })
              }
              className="block bg-slate-800 border border-slate-700 rounded-xl p-5 transition-colors hover:border-teal-500/40"
            >
              <div className="text-base font-semibold text-white mb-1">
                🧭 How ready are you to pivot?
              </div>
              <div className="text-sm text-slate-400">Take the 60-second readiness check →</div>
            </Link>
          </div>
        </section>

        <button
          type="button"
          onClick={reset}
          className="mx-auto mt-8 block text-sm text-slate-400 hover:text-slate-200"
        >
          ↺ Start over
        </button>
      </div>
    );
  }

  // ── Input view ──────────────────────────────────────────────────────────────
  const optionBase =
    "w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";
  const optionOn = "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30 text-white";
  const optionOff =
    "border-slate-700 bg-slate-800 text-slate-200 hover:border-teal-500/60 hover:bg-slate-800/80";

  return (
    <div className="bg-card border border-slate-700 rounded-2xl p-6 sm:p-8">
      {/* Field */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">What&apos;s your current field?</h2>
        <p className="text-sm text-slate-400 mb-4">Pick the one closest to your background.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SOURCE_FIELDS.map((f) => {
            const on = input.field === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => selectField(f.id)}
                className={`${optionBase} ${on ? optionOn : optionOff}`}
              >
                <span className="text-sm sm:text-base">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">What are your strengths?</h2>
        <p className="text-sm text-slate-400 mb-4">
          Pick up to {MAX_SKILLS} ({input.skills.length}/{MAX_SKILLS} selected).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SKILLS.map((s) => {
            const on = input.skills.includes(s.id);
            const atMax = input.skills.length >= MAX_SKILLS && !on;
            return (
              <button
                key={s.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleSkill(s.id)}
                className={`${optionBase} ${on ? optionOn : optionOff} ${
                  atMax ? "opacity-50" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex-shrink-0 w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                      on ? "border-teal-400 bg-teal-500/20" : "border-slate-600"
                    }`}
                  >
                    {on && <span className="w-2 h-2 rounded-sm bg-teal-400" />}
                  </span>
                  <span className="text-sm sm:text-base">{s.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={showResults}
        disabled={!canSubmit}
        className="w-full px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        Show my ranked roles →
      </button>
      {!canSubmit && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Pick your field and at least one strength to see your matches.
        </p>
      )}
    </div>
  );
}
