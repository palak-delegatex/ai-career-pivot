// StatSection — topic-grouped stat row for the data page (AIC-1234 §3.2).
// Thin server wrapper: eyebrow + heading + responsive grid of card-wrapped
// StatBlocks. Each child stat block is composable; this section owns the card
// surface and the grid (StatBlock itself has no background, per AIC-1200 §2.3).

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const COLS: Record<2 | 3 | 4, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-2 xl:grid-cols-4",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface StatSectionProps {
  eyebrow: string;
  heading: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
}

export default function StatSection({
  eyebrow,
  heading,
  columns = 3,
  children,
}: StatSectionProps) {
  const headingId = `${slugify(heading)}-heading`;
  return (
    <section className="py-12 sm:py-16 border-t border-slate-800" aria-labelledby={headingId}>
      <p className="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mb-2">
        {eyebrow}
      </p>
      <h2 id={headingId} className="font-heading text-xl sm:text-2xl font-bold text-white mb-6">
        {heading}
      </h2>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6", COLS[columns])}>
        {children}
      </div>
    </section>
  );
}
