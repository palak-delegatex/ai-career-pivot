"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import type { WarmIntroContact } from "./types";
import WarmIntroDraft from "./WarmIntroDraft";
import WarmIntroShareCard from "./WarmIntroShareCard";
import {
  trackWarmIntroCopied,
  trackWarmIntroSent,
} from "@/lib/tracking";

// Local mirror of JobDetailView's STRENGTH_BADGE (spec: reuse the same tiers).
const STRENGTH_BADGE: Record<string, string> = {
  strong: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  warm: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  new: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  cold: "bg-slate-500/15 border-slate-500/30 text-slate-400",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

// Unlocked (paid) — full contact + connection path + drafted intro. The
// connection card animates blur→clear on mount (the "reveal moment").
export default function WarmIntroUnlocked({
  contact,
  draftMessage,
  draftLoading,
  company,
  jobId,
  onEditDraft,
}: {
  contact: WarmIntroContact;
  draftMessage: string;
  draftLoading?: boolean;
  company: string;
  jobId: string;
  onEditDraft: (msg: string) => void;
}) {
  const reduce = useReducedMotion();
  const ctx = { company, job_id: jobId };

  return (
    <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-4 space-y-4">
      <div className="flex items-center gap-1.5">
        <Sparkles
          className={`h-3.5 w-3.5 text-teal-400 ${reduce ? "" : "phase-confetti"}`}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
          Your warm intro
        </span>
      </div>

      {/* Connection card — reveals blur→clear on first mount. */}
      <motion.div
        initial={reduce ? false : { filter: "blur(6px)", opacity: 0.6 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
            {initials(contact.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">
              {contact.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {contact.role || "Connection"} at {company}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${STRENGTH_BADGE[contact.strength_tier] ?? STRENGTH_BADGE.cold}`}
          >
            {contact.strength_tier}
          </span>
        </div>

        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#0A66C2] hover:underline mt-2"
          >
            <ExternalLink className="h-3 w-3" /> LinkedIn profile
          </a>
        )}

        {/* Connection path: direct in MVP, "via {mutual}" when a mutual exists. */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/[0.04]">
          <span className="text-slate-400">You</span>
          {contact.mutual_name && (
            <>
              <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
              <span className="text-slate-400">{contact.mutual_name}</span>
            </>
          )}
          <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
          <span className="text-teal-400">{contact.name.split(" ")[0]}</span>
        </div>
      </motion.div>

      {/* Drafted intro */}
      {draftLoading ? (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting a personalized
          intro…
        </div>
      ) : draftMessage ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: reduce ? 0 : 0.2 }}
        >
          <WarmIntroDraft
            message={draftMessage}
            onEdit={onEditDraft}
            contactName={contact.name}
            channel={contact.linkedin_url ? "linkedin" : "email"}
            linkedinUrl={contact.linkedin_url}
            onCopy={() => trackWarmIntroCopied({ ...ctx, channel: "clipboard" })}
            onSend={(channel) => trackWarmIntroSent({ ...ctx, channel })}
          />
        </motion.div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <WarmIntroShareCard
          company={company}
          contactRole={contact.role || "hiring manager"}
          mutualName={contact.mutual_name}
          jobId={jobId}
        />
      </div>
    </div>
  );
}
