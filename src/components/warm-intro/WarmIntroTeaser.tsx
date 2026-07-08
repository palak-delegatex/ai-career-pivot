"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2, User } from "lucide-react";

// Teaser — the conversion state. A connection exists but the user is free-tier.
// Reveals role + degree + confidence (value proof) while blurring the identity
// (name/avatar). Amber accent = Von Restorff isolation from the teal system.
export default function WarmIntroTeaser({
  company,
  role,
  degree,
  confidence,
  onUpgrade,
}: {
  company: string;
  role: string | null;
  degree: number;
  confidence: number;
  onUpgrade: () => void;
}) {
  const reduce = useReducedMotion();
  const degreeLabel = degree <= 1 ? "In your direct network" : `${degree}nd-degree via your network`;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-teal-500/[0.04] p-4"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles
          className={`h-3.5 w-3.5 text-amber-400 ${reduce ? "" : "animate-warm-pulse"}`}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
          Warm intro found
        </span>
      </div>

      {/* Blurred identity card — role visible, name/avatar hidden. */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 select-none"
            style={{ filter: "blur(6px)" }}
            aria-hidden
          >
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[12px] font-semibold text-slate-200 select-none"
              style={{ filter: "blur(6px)" }}
              aria-hidden
            >
              Sarah █████
            </p>
            <p className="text-[12px] text-slate-300 truncate">
              {role || "Connection"} at {company}
            </p>
          </div>
        </div>
        <span className="sr-only">
          Connection details hidden — upgrade to reveal who this is.
        </span>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-950/50 border border-teal-500/20 text-[10px] text-teal-400">
            {degreeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {confidence >= 75 ? "Strong match" : "Likely match"} · {confidence}%
          </span>
        </div>
      </div>

      {/* Unlock CTA — RoadmapPaywallGate framing. */}
      <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-teal-300/[0.05] p-4 text-center">
        <p className="text-[13px] font-semibold text-slate-100">
          Unlock this connection
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
          See who it is + get an AI-drafted intro ask
        </p>
        <button
          onClick={onUpgrade}
          aria-label="Unlock warm intro — upgrade to reveal this connection"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
        >
          Unlock Warm Intro <ArrowRight className="h-4 w-4" />
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-2.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          847+ career pivoters trust us
        </p>
      </div>
    </motion.div>
  );
}
