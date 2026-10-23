// Editorial selections: no keyword guessing. Each public destination has a
// bounded promise shared by the early and concluding invitation.
export const blogOffers = {
  explore: { destination: "/quiz" },
  snapshot: { destination: "/free?mode=upload" },
  planning: { destination: "/readiness" },
  posting: { destination: "/free" },
} as const;
export type BlogIntent = keyof typeof blogOffers;
export const articleNextSteps: Record<string, BlogIntent> = {
  "how-to-pivot-into-ai-without-starting-over-2026": "snapshot",
  "how-to-pivot-into-ai-when-your-job-is-being-automated-2026": "planning",
  "how-to-pivot-from-engineering-to-ai-2026": "explore",
  "ai-job-titles-explained-career-changers-2026": "explore",
  "what-does-an-ai-enablement-manager-do-2026": "posting",
};
