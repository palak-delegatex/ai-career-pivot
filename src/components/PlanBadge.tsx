"use client";

import type { Plan } from "@/lib/usage-gating";

const planConfig: Record<Plan, { bg: string; border: string; color: string; label: string }> = {
  free: {
    bg: "rgba(13, 148, 136, 0.12)",
    border: "rgba(13, 148, 136, 0.25)",
    color: "#2dd4bf",
    label: "Free Plan",
  },
  report: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    label: "Pro",
  },
  lifetime: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    label: "Lifetime",
  },
};

export default function PlanBadge({ plan }: { plan: Plan }) {
  const config = planConfig[plan];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
