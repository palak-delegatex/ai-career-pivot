/**
 * MicroProof (AIC-893 — replaces the removed MicroTestimonial).
 *
 * One substantiable factual line WITH its source. No person, no rating, no
 * outcome number. Defaults to the honest methodology/data claim; callers can
 * pass a different verified line + source.
 */
import { CheckCircle2 } from "lucide-react";

export default function MicroProof({
  line = "Salary ranges and role-growth outlook reflect public U.S. labor-market data",
  source = "U.S. Bureau of Labor Statistics (OEWS)",
  className = "",
}: {
  line?: string;
  source?: string;
  className?: string;
}) {
  return (
    <p className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden />
      <span>
        {line}
        {source ? <span className="text-slate-500"> · Source: {source}</span> : null}
      </span>
    </p>
  );
}
