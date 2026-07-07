import { ShieldCheck } from "lucide-react";

/**
 * GuaranteeCard (AIC-753)
 *
 * Visual guarantee block that replaces the flat text-only trust-badge row
 * on the pricing page. Signals confidence with a gradient shield + copy.
 * Pricing page is not i18n'd on main, so title/body are passed in (English).
 */
export default function GuaranteeCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4 max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-gradient-to-br from-teal-950/30 to-emerald-900/15 border border-teal-500/20">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
