/**
 * ContextualValueNote (AIC-893 — replaces the removed ContextualTestimonial).
 *
 * A small inline methodology/value note for use inside a flow (upload form,
 * upgrade sheet, plan page). Defaults to the honest methodology line; no person,
 * no quote, no outcome claim.
 */
import { Info } from "lucide-react";
import { METHODOLOGY_LINE } from "@/lib/credibility";

export default function ContextualValueNote({
  text = METHODOLOGY_LINE,
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden />
      <p className="text-xs leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}
