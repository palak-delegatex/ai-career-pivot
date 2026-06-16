export type JobStage =
  | "saved"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected";

export type JobSource =
  | "linkedin"
  | "indeed"
  | "glassdoor"
  | "direct"
  | "other";

export interface StageHistoryEntry {
  from: JobStage;
  to: JobStage;
  at: string;
}

export interface TrackedJob {
  id: string;
  user_email: string;
  role: string;
  company: string;
  company_color: string;
  url?: string;
  source: JobSource;
  stage: JobStage;
  match_score: number;
  next_action?: string;
  notes?: string;
  salary_range?: string;
  location?: string;
  stage_history?: StageHistoryEntry[];
  applied_at?: string;
  stage_changed_at: string;
  created_at: string;
}

export const STAGES: {
  key: JobStage;
  label: string;
  dotColor: string;
}[] = [
  { key: "saved", label: "Saved", dotColor: "bg-slate-400" },
  { key: "applied", label: "Applied", dotColor: "bg-teal-500" },
  { key: "phone_screen", label: "Phone Screen", dotColor: "bg-cyan-400" },
  { key: "interview", label: "Interview", dotColor: "bg-amber-400" },
  { key: "offer", label: "Offer", dotColor: "bg-emerald-400" },
  { key: "rejected", label: "Rejected", dotColor: "bg-red-500" },
];

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
