"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { HonestProofSignal } from "@/lib/honest-proof";
import { PROOF_METRICS } from "@/lib/proof-metrics";
import { trackHonestProofShown } from "@/lib/tracking";

// Honest, DB-sourced social-proof badge (AIC-879 / engine AIC-874).
//
// Replaces the fabricated hardcoded counters ("547 reports this week", the
// ~1,900 fake live ticker) that still contradicted AIC-862's honest-signals
// policy. Reads REAL `plan_leads` momentum from /api/proof-signal; the server
// floor-gates the number so a weak/zero count never renders. When nothing
// clears the floor, we degrade to a verifiable *capability* signal (never an
// invented outcome number) — and the `compact` header variant renders nothing
// at all rather than pad the header with a non-count.
//
// Variants:
//  - `compact` — inline pill for a header row (no capability fallback: the
//    header reads clean when there's no honest count to show).
//  - `live`    — a live-dot momentum line for the /free upload form.

type Variant = "compact" | "live";

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export default function HonestProofBadge({
  variant = "compact",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const [signal, setSignal] = useState<HonestProofSignal | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/proof-signal")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: HonestProofSignal) => {
        if (!active) return;
        setSignal(data);
        if (data.primary) {
          trackHonestProofShown({ kind: data.primary.kind, value: data.primary.value });
        } else if (variant === "live") {
          trackHonestProofShown({ kind: "capability" });
        }
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [variant]);

  const primary = signal?.primary ?? null;

  // ── Compact header pill: only ever shows a REAL count, else nothing. ─────────
  if (variant === "compact") {
    if (!primary) return null;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-400 ${className}`}
      >
        <Users className="w-3 h-3 text-teal-400" />
        <span>
          <strong className="text-slate-300">{formatCount(primary.value)}</strong> {primary.label}
        </span>
      </div>
    );
  }

  // ── Live momentum line (/free upload form). ─────────────────────────────────
  // Real count when available; otherwise a truthful capability signal so the
  // form still carries a trust cue without a fabricated number.
  if (variant === "live") {
    // Hide entirely only while the first fetch is still in flight, to avoid a
    // layout flash; after that we always have something honest to show.
    if (!signal && !failed) return null;

    if (primary) {
      return (
        <div className={`flex items-center justify-center gap-2 text-xs text-slate-400 ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          <span>
            <strong className="text-slate-200 font-semibold tabular-nums">{formatCount(primary.value)}</strong>{" "}
            {primary.label}
          </span>
        </div>
      );
    }

    return (
      <div className={`flex items-center justify-center gap-2 text-xs text-slate-400 ${className}`}>
        <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span>
          Free roadmap in <strong className="text-slate-200 font-semibold">{PROOF_METRICS.freeSpeed}</strong> ·{" "}
          {PROOF_METRICS.noSignup} to start
        </span>
      </div>
    );
  }

  return null;
}
