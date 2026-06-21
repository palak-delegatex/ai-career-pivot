export type QueueStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "applied"
  | "skipped";

export type ApplyMode = "review_first" | "auto_submit" | "hybrid";

export interface AutoApplyPreferences {
  id: string;
  user_email: string;
  enabled: boolean;
  target_roles: string[];
  preferred_locations: string[];
  remote_only: boolean;
  min_match_score: number;
  salary_min: number;
  excluded_companies: string[];
  excluded_keywords: string[];
  max_daily_applications: number;
  sources: string[];
  skip_2fa_sites: boolean;
  apply_mode: ApplyMode;
  auto_submit_threshold: number;
  customize_resume: boolean;
  generate_cover_letter: boolean;
  created_at: string;
  updated_at: string;
}

export interface EngineStatus {
  enabled: boolean;
  lastScanAt: string | null;
  lastProcessAt: string | null;
  todayScanned: number;
  todayQueued: number;
  todayApplied: number;
  todayAutoSubmitted: number;
  pendingReview: number;
  approvedPending: number;
  applyMode: ApplyMode;
}

export interface ApplicationLog {
  id: string;
  user_email: string;
  queue_item_id: string;
  action: "scanned" | "queued" | "auto_submitted" | "applied" | "cover_letter_generated" | "resume_tailored";
  job_title: string;
  company: string;
  details: string;
  created_at: string;
}

export const SOURCE_RATE_LIMITS: Record<string, { maxPerHour: number; delayMs: number }> = {
  jsearch: { maxPerHour: 30, delayMs: 2000 },
  adzuna: { maxPerHour: 50, delayMs: 1000 },
  remotive: { maxPerHour: 60, delayMs: 500 },
};

export interface QueueItem {
  id: string;
  user_email: string;
  job_title: string;
  company: string;
  url: string;
  source: string;
  location: string;
  salary: string;
  job_type: string;
  description_snippet: string;
  tags: string[];
  match_score: number;
  matched_skills: string[];
  match_reasons: MatchReason[];
  status: QueueStatus;
  feedback: string;
  resume_version_id?: string;
  cover_letter_id?: string;
  applied_at?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface MatchReason {
  factor: string;
  detail: string;
  weight: number;
}

export interface FeedbackEntry {
  id: string;
  user_email: string;
  queue_item_id: string;
  action: string;
  reason: string;
  job_title: string;
  company: string;
  match_score: number;
  created_at: string;
}

const WORKDAY_DOMAINS = [
  "myworkdayjobs.com",
  "wd1.myworkdaysite.com",
  "wd5.myworkdaysite.com",
  "workday.com",
];

export function requires2FA(url: string): boolean {
  const lower = url.toLowerCase();
  return WORKDAY_DOMAINS.some((d) => lower.includes(d));
}

export function applyFeedbackBoost(
  baseScore: number,
  company: string,
  jobTitle: string,
  feedback: FeedbackEntry[]
): number {
  if (feedback.length === 0) return baseScore;

  let boost = 0;
  const companyLower = company.toLowerCase();
  const titleLower = jobTitle.toLowerCase();

  for (const entry of feedback) {
    const sameCompany = entry.company.toLowerCase() === companyLower;
    const similarTitle =
      entry.job_title.toLowerCase().includes(titleLower) ||
      titleLower.includes(entry.job_title.toLowerCase());

    if (entry.action === "approved" || entry.action === "applied") {
      if (sameCompany) boost += 8;
      if (similarTitle) boost += 5;
    } else if (entry.action === "rejected") {
      if (sameCompany) boost -= 6;
      if (similarTitle) boost -= 3;
    } else if (entry.action === "irrelevant") {
      if (sameCompany) boost -= 10;
      if (similarTitle) boost -= 8;
    }
  }

  return Math.max(0, Math.min(99, baseScore + boost));
}

export function shouldIncludeJob(
  job: {
    title: string;
    company_name: string;
    url: string;
    location?: string;
    salary?: string;
  },
  prefs: AutoApplyPreferences
): { include: boolean; reason?: string } {
  const titleLower = job.title.toLowerCase();
  const companyLower = job.company_name.toLowerCase();

  if (
    prefs.excluded_companies.some(
      (c) => companyLower.includes(c.toLowerCase())
    )
  ) {
    return { include: false, reason: "Excluded company" };
  }

  if (
    prefs.excluded_keywords.some((k) => titleLower.includes(k.toLowerCase()))
  ) {
    return { include: false, reason: "Excluded keyword in title" };
  }

  if (prefs.skip_2fa_sites && requires2FA(job.url)) {
    return { include: false, reason: "Requires 2FA (Workday)" };
  }

  if (prefs.remote_only && job.location) {
    const locLower = job.location.toLowerCase();
    if (
      !locLower.includes("remote") &&
      !locLower.includes("anywhere") &&
      !locLower.includes("worldwide")
    ) {
      return { include: false, reason: "Not remote" };
    }
  }

  return { include: true };
}

export function buildMatchReasons(
  matchedSkills: string[],
  totalSkills: number,
  titleOverlap: boolean,
  feedbackBoost: number
): MatchReason[] {
  const reasons: MatchReason[] = [];

  if (matchedSkills.length > 0) {
    reasons.push({
      factor: "Skills match",
      detail: `${matchedSkills.length}/${totalSkills} of your skills found in listing`,
      weight: matchedSkills.length / Math.max(totalSkills, 1),
    });
  }

  if (titleOverlap) {
    reasons.push({
      factor: "Role alignment",
      detail: "Job title closely matches your target role",
      weight: 0.2,
    });
  }

  if (feedbackBoost > 0) {
    reasons.push({
      factor: "Learning signal",
      detail: "Boosted based on your past approvals of similar jobs",
      weight: feedbackBoost / 20,
    });
  } else if (feedbackBoost < 0) {
    reasons.push({
      factor: "Learning signal",
      detail: "Reduced based on your past rejections of similar jobs",
      weight: feedbackBoost / 20,
    });
  }

  return reasons;
}

export function shouldAutoSubmit(
  score: number,
  prefs: AutoApplyPreferences
): boolean {
  if (prefs.apply_mode === "review_first") return false;
  if (prefs.apply_mode === "auto_submit") return score >= prefs.auto_submit_threshold;
  // hybrid: auto-submit only above the auto_submit_threshold
  return score >= prefs.auto_submit_threshold;
}

export const QUEUE_STATUS_CONFIG: Record<
  QueueStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending_review: {
    label: "Pending Review",
    color: "text-amber-300",
    bgColor: "bg-amber-900/40 border-amber-700/40",
  },
  approved: {
    label: "Approved",
    color: "text-emerald-300",
    bgColor: "bg-emerald-900/40 border-emerald-700/40",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-300",
    bgColor: "bg-red-900/40 border-red-700/40",
  },
  applied: {
    label: "Applied",
    color: "text-teal-300",
    bgColor: "bg-teal-900/40 border-teal-700/40",
  },
  skipped: {
    label: "Skipped",
    color: "text-slate-400",
    bgColor: "bg-slate-700/40 border-slate-600/40",
  },
};
