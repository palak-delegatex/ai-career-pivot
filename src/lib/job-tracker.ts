export type JobStage =
  | "exploring"
  | "applied"
  | "interviewing"
  | "offer"
  | "pivoted"
  | "passed";

export type JobSource =
  | "linkedin"
  | "indeed"
  | "glassdoor"
  | "direct"
  | "other";

export type SourceType = "manual" | "extension_clip";

export interface TrackedJob {
  id: string;
  user_email: string;
  role: string;
  company: string;
  company_color: string;
  url?: string;
  source: JobSource;
  source_type?: SourceType;
  stage: JobStage;
  match_score: number;
  next_action?: string;
  notes?: string;
  /** Raw job description text, used to seed the resume tailor's Live Match tab. */
  job_description?: string;
  applied_at?: string;
  stage_changed_at: string;
  created_at: string;
}

export const STAGES: {
  key: JobStage;
  label: string;
  dotColor: string;
  emptyState: string;
}[] = [
  { key: "exploring", label: "Exploring", dotColor: "bg-slate-400", emptyState: "Start adding roles you're curious about" },
  { key: "applied", label: "Applied", dotColor: "bg-teal-500", emptyState: "Drag roles here once you've applied" },
  { key: "interviewing", label: "Interviewing", dotColor: "bg-amber-400", emptyState: "Interviews incoming — you've got this" },
  { key: "offer", label: "Offer", dotColor: "bg-emerald-400", emptyState: "Offers land here. Keep going!" },
  { key: "pivoted", label: "Pivoted!", dotColor: "bg-violet-400", emptyState: "Your success stories will live here 🎉" },
  { key: "passed", label: "Passed", dotColor: "bg-slate-500", emptyState: "No passes yet — that's a good sign" },
];

export const STAGE_CTAS: Record<JobStage, { label: string; icon: string }> = {
  exploring: { label: "AI Match Analysis", icon: "Sparkles" },
  applied: { label: "Set Follow-up", icon: "Clock" },
  interviewing: { label: "Prep Materials", icon: "BookOpen" },
  offer: { label: "Compare Offers", icon: "Scale" },
  pivoted: { label: "Share Your Story", icon: "Megaphone" },
  passed: { label: "Find Similar", icon: "Search" },
};

const COMPANY_COLORS = [
  "from-blue-500 to-green-500",
  "from-violet-500 to-purple-500",
  "from-amber-600 to-amber-800",
  "from-slate-800 to-slate-600",
  "from-blue-600 to-blue-800",
  "from-red-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-blue-500",
  "from-cyan-500 to-sky-500",
];

export function pickCompanyColor(company: string): string {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = (hash * 31 + company.charCodeAt(i)) | 0;
  }
  return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
}

export function detectSource(url: string): JobSource {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("indeed.com")) return "indeed";
  if (lower.includes("glassdoor.com")) return "glassdoor";
  return "direct";
}

export function daysInStage(stageChangedAt: string): number {
  const diff = Date.now() - new Date(stageChangedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function daysInStageUrgency(days: number): string {
  if (days < 7) return "text-slate-500";
  if (days <= 14) return "text-amber-400/70";
  return "text-red-400/70";
}
