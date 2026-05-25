export interface WorkExperience {
  title: string;
  company: string;
  startYear: number;
  endYear: number | null;
  description: string;
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number | null;
}

export interface UserProfile {
  email: string;
  name?: string;
  currentTitle?: string;
  currentIndustry?: string;
  yearsExperience?: number;
  skills: string[];
  transferableSkills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  interests: string[];
  linkedinUrl?: string;
  websiteUrl?: string;
  rawSummary?: string;
}

export interface SkillGap {
  skill: string;
  currentLevel: string;
  requiredLevel: string;
  priority: "high" | "medium" | "low";
  resource?: string;
}

export interface WeekOneAction {
  title: string;
  instruction: string;
  timeEstimate: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface FinancialSummary {
  currentSalaryRange: string;
  targetSalaryRange: string;
  salaryUpliftPercent: number;
  transitionCosts: string[];
  roiTimeframe: string;
}

export interface RecommendedResource {
  name: string;
  provider: string;
  type: string;
  url: string;
  cost: string;
  timeEstimate: string;
}

export interface PivotPlan {
  targetRole: string;
  targetIndustry: string;
  rationale: string;
  matchScore?: number;
  skillMatchPercent?: number;
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
  skillGaps?: SkillGap[];
  weekOneActions?: WeekOneAction[];
  estimatedTimeToTransition: string;
  financialSummary?: FinancialSummary;
  recommendedResources?: RecommendedResource[];
  /** @deprecated Use skillGaps (structured) instead */
  legacySkillGaps?: string[];
  /** @deprecated Use weekOneActions instead */
  keyActions?: string[];
  /** @deprecated Use financialSummary instead */
  financialConsiderations?: string;
}

export interface IntakeResult {
  profile: UserProfile;
  plans: PivotPlan[];
}
