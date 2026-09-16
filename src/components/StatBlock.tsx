// StatBlock — a single statistic rendered as a prominent, quotable, citation-
// friendly block (AIC-1233, design AIC-1200 Part 2 + AIC-1234 Part 2 "v2").
// The value/label/source hierarchy is a server component; when `shareable` is
// set it also renders the <StatActions> client island (copy-quote + share).
// Used on the /research/ai-career-pivots-2026 data page, the /readiness result,
// blog MDX embeds, and PivotOnRamp — one component, one visual DNA.
//
// Quotability contract (do NOT rename without updating the speakable JSON-LD):
//   - outer <figure class="stat-block"> is the speakable cssSelector target
//   - data-stat-value / data-stat-label / data-stat-source let answer engines
//     extract the number + attribution without parsing visual layout
//   - schema.org/Observation microdata gives engines a second extraction path
//   - a stable id (`stat-<label-slug>`) enables deep-link citation
//     (e.g. /research/ai-career-pivots-2026#stat-median-ai-role-salary)

import { cn } from "@/lib/utils";
import StatActions from "@/components/StatActions";

export interface StatBlockProps {
  value: string; // "33.5%", "3.2x", "14,000+", "$127K"
  label: string; // "of career changers report smoother transitions"
  source?: string; // "U.S. Bureau of Labor Statistics, 2024"
  sourceUrl?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string; // "+12% YoY"
  size?: "sm" | "md" | "lg"; // default "md"
  accent?: "teal" | "emerald" | "amber"; // default "teal"
  /** Explicit anchor id override; defaults to a slug of `label`. */
  id?: string;
  className?: string;
  // ── v2 extensions (AIC-1234 §2.2) ──
  /** Show copy/share buttons (data page). Default false. */
  shareable?: boolean;
  /** Section label passed through to analytics on copy/share. */
  section?: string;
  /** Left (default) or center alignment (center for PivotOnRamp context). */
  align?: "left" | "center";
  /** Semantic wrapper. Default "figure" (citation-friendly). */
  as?: "figure" | "div";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const VALUE_SIZE: Record<NonNullable<StatBlockProps["size"]>, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-7xl",
};

const LABEL_SIZE: Record<NonNullable<StatBlockProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const PADDING: Record<NonNullable<StatBlockProps["size"]>, string> = {
  sm: "pl-4",
  md: "pl-6",
  lg: "pl-6 sm:pl-8",
};

const ACCENT_BORDER: Record<NonNullable<StatBlockProps["accent"]>, string> = {
  teal: "border-l-teal-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
};

const TREND_META: Record<
  NonNullable<StatBlockProps["trend"]>,
  { arrow: string; className: string }
> = {
  up: { arrow: "↑", className: "text-emerald-400" },
  down: { arrow: "↓", className: "text-red-400" },
  neutral: { arrow: "→", className: "text-slate-400" },
};

export function StatBlock({
  value,
  label,
  source,
  sourceUrl,
  trend,
  trendLabel,
  size = "md",
  accent = "teal",
  id,
  className,
  shareable = false,
  section,
  align = "left",
  as = "figure",
}: StatBlockProps) {
  const anchorId = id ?? `stat-${slugify(label)}`;
  const t = trend ? TREND_META[trend] : null;
  const Wrapper = as;

  return (
    <Wrapper
      id={anchorId}
      className={cn(
        "stat-block scroll-mt-24 border-l-4 not-prose",
        ACCENT_BORDER[accent],
        PADDING[size],
        align === "center" && "text-center flex flex-col items-center",
        shareable && "group relative",
        className,
      )}
      data-stat-value={value}
      data-stat-label={label}
      data-stat-source={source}
      itemScope
      itemType="https://schema.org/Observation"
    >
      <div
        className={cn(
          "stat-value font-heading font-bold tabular-nums text-white leading-none",
          VALUE_SIZE[size],
        )}
        itemProp="value"
      >
        {value}
      </div>
      <figcaption
        className={cn(
          "stat-label mt-2 text-slate-300 leading-relaxed max-w-[32ch]",
          LABEL_SIZE[size],
        )}
        itemProp="name"
      >
        {label}
      </figcaption>

      {t && trendLabel && (
        <div className={cn("mt-3 flex items-center gap-1.5 text-sm font-medium", t.className)}>
          <span aria-hidden="true">{t.arrow}</span>
          <span>{trendLabel}</span>
        </div>
      )}

      {source && (
        <div className="mt-2 text-xs text-slate-500">
          {sourceUrl ? (
            <>
              Source:{" "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stat-source underline decoration-slate-600 underline-offset-2 hover:text-slate-400"
                itemProp="observedBy"
              >
                {source}
              </a>
            </>
          ) : (
            <span className="stat-source" itemProp="observedBy">
              Source: {source}
            </span>
          )}
        </div>
      )}

      {shareable && (
        <StatActions
          value={value}
          label={label}
          source={source}
          anchor={anchorId}
          section={section}
          align={align}
        />
      )}
    </Wrapper>
  );
}

export default StatBlock;
