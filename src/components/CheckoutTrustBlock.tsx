import { ShieldCheck, Lock, Users, Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * CheckoutTrustBlock (AIC-753)
 *
 * Inline trust lines rendered below each pricing CTA — reduces perceived
 * risk at the moment of commitment (loss aversion). Used inside each
 * pricing CardFooter. Pricing page is not i18n'd on main, so text is
 * passed in as ReactNode (English) by the caller.
 */
const ICONS = {
  shield: ShieldCheck,
  lock: Lock,
  users: Users,
  check: Check,
} as const;

export type TrustIcon = keyof typeof ICONS;

export interface TrustLine {
  icon: TrustIcon;
  text: ReactNode;
}

export default function CheckoutTrustBlock({ items }: { items: TrustLine[] }) {
  return (
    <div className="w-full flex flex-col gap-2 mt-3 px-4 py-3 rounded-[10px] bg-teal-950/20 border border-teal-500/15">
      {items.map((line, i) => {
        const Icon = ICONS[line.icon];
        return (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{line.text}</span>
          </div>
        );
      })}
    </div>
  );
}
