/**
 * CheckoutReassurance (AIC-893 — replaces the removed David C. micro-testimonial
 * on PricingCheckout).
 *
 * Trust, not endorsement: "what happens next," plus the real, already-live
 * commercial facts (one-time payment / no subscription / 30-day money-back
 * guarantee / secure Stripe checkout). Every claim here is true today — see the
 * live guarantee copy on /pricing (GuaranteeCard, refund FAQ).
 */
import { ShieldCheck } from "lucide-react";

const STEPS = [
  "Enter your email and pay securely via Stripe.",
  "Your personalized report is generated right after checkout.",
  "Not useful? Email us within 30 days for a full refund.",
];

export default function CheckoutReassurance({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
        <span className="text-sm font-semibold text-white">What happens next</span>
      </div>
      <ol className="space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5 text-xs text-slate-400">
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-[10px] font-bold text-teal-300">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] font-medium text-slate-500">
        One-time payment · No subscription · Cancel-free (nothing recurring to cancel)
      </p>
    </div>
  );
}
