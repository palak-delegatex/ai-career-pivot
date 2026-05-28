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

export interface UserCircumstances {
  salaryFloor?: string;
  dependents?: "none" | "partner" | "children" | "caretaker";
  timeline?: "asap" | "3-6 months" | "6-12 months" | "1-2 years";
  riskTolerance?: "conservative" | "moderate" | "aggressive";
  willingnessToRelocate?: "yes" | "no" | "remote-preferred";
}

export interface UserLocation {
  city?: string;
  region?: string;
  country?: string;
  source: "gps" | "manual";
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
  circumstances?: UserCircumstances;
  location?: UserLocation;
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

export interface AIToolkitItem {
  tool: string;
  category: string;
  useCase: string;
  proficiencyNeeded: "beginner" | "intermediate" | "advanced";
}

export interface PathTradeoffs {
  difficulty: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  timeToFirstRole: string;
  incomeImpactNear: string;
  incomePotentialLong: string;
  pros: string[];
  cons: string[];
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
  aiToolkit?: AIToolkitItem[];
  tradeoffs?: PathTradeoffs;
  /** @deprecated Use skillGaps (structured) instead */
  legacySkillGaps?: string[];
  /** @deprecated Use weekOneActions instead */
  keyActions?: string[];
  /** @deprecated Use financialSummary instead */
  financialConsiderations?: string;
}

export interface MarketData {
  role: string;
  salaryP10: number;
  salaryP25: number;
  salaryMedian: number;
  salaryP75: number;
  salaryP90: number;
  totalEmployment: number;
  jobPostingsCount: number | null;
  growthPercent: number | null;
  growthLabel: string;
  source: string;
  updatedAt: string;
}

export interface IntakeResult {
  profile: UserProfile;
  plans: PivotPlan[];
}
