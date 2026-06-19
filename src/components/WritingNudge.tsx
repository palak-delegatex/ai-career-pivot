"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Zap,
  BarChart3,
  AlertTriangle,
  Search,
  Ruler,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNudgeDismissed } from "@/lib/help-state";

// ── Types ───────────────────────────────────────────────────────────────────

export type NudgeType =
  | "action-verb"
  | "add-metrics"
  | "too-vague"
  | "ats-keyword"
  | "too-long";

export interface WritingNudgeData {
  type: NudgeType;
  message: string;
  suggestion?: string;
}

interface WritingNudgeProps {
  nudges: WritingNudgeData[];
  onApply?: (nudge: WritingNudgeData) => void;
  maxVisible?: number;
  className?: string;
}

// ── Nudge config ────────────────────────────────────────────────────────────

const NUDGE_CONFIG: Record<
  NudgeType,
  { icon: typeof Zap; label: string; style: string }
> = {
  "action-verb": {
    icon: Zap,
    label: "Action verb",
    style: "border-amber-700/40 bg-amber-900/20 text-amber-300",
  },
  "add-metrics": {
    icon: BarChart3,
    label: "Add metrics",
    style: "border-emerald-700/40 bg-emerald-900/20 text-emerald-300",
  },
  "too-vague": {
    icon: AlertTriangle,
    label: "Too vague",
    style: "border-red-700/40 bg-red-900/20 text-red-300",
  },
  "ats-keyword": {
    icon: Search,
    label: "ATS keyword",
    style: "border-blue-700/40 bg-blue-900/20 text-blue-300",
  },
  "too-long": {
    icon: Ruler,
    label: "Too long",
    style: "border-purple-700/40 bg-purple-900/20 text-purple-300",
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export function WritingNudge({
  nudges,
  onApply,
  maxVisible = 2,
  className,
}: WritingNudgeProps) {
  const [localDismissed, setLocalDismissed] = useState<Set<number>>(new Set());

  const visibleNudges = useMemo(() => {
    return nudges
      .map((nudge, index) => ({ nudge, index }))
      .filter(({ index }) => !localDismissed.has(index))
      .slice(0, maxVisible);
  }, [nudges, localDismissed, maxVisible]);

  const handleDismiss = useCallback((index: number) => {
    setLocalDismissed((prev) => new Set(prev).add(index));
  }, []);

  const handleApply = useCallback(
    (nudge: WritingNudgeData, index: number) => {
      onApply?.(nudge);
      handleDismiss(index);
    },
    [onApply, handleDismiss]
  );

  if (visibleNudges.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)} role="list" aria-label="Writing suggestions">
      {visibleNudges.map(({ nudge, index }) => {
        const config = NUDGE_CONFIG[nudge.type];
        const Icon = config.icon;

        return (
          <div
            key={`${nudge.type}-${index}`}
            role="listitem"
            className={cn(
              "nudge-card flex items-start gap-3 rounded-lg border p-3",
              config.style
            )}
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <Icon className="size-3.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{config.label}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                {nudge.message}
              </p>
              {nudge.suggestion && (
                <p className="mt-1 text-xs font-medium opacity-90">
                  → {nudge.suggestion}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {nudge.suggestion && onApply && (
                <button
                  onClick={() => handleApply(nudge, index)}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                  aria-label="Apply suggestion"
                  title="Apply suggestion"
                >
                  <Check className="size-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDismiss(index)}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                aria-label="Dismiss"
                title="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
