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

export interface PivotPlan {
  targetRole: string;
  targetIndustry: string;
  rationale: string;
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
  skillGaps: string[];
  keyActions: string[];
  estimatedTimeToTransition: string;
  financialConsiderations: string;
}

export interface IntakeResult {
  profile: UserProfile;
  plans: PivotPlan[];
}

export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export type FinancialObligationBand =
  | "under_2k"
  | "2k_4k"
  | "4k_7k"
  | "7k_10k"
  | "10k_15k"
  | "over_15k";

export interface FamilyConstraints {
  hasKids: boolean;
  numberOfKids?: number;
  partnerIncome: "none" | "partial" | "primary" | "equal";
  locationLocked: boolean;
  locationReason?: string;
}

// Captured from the expanded intake form — Issue #2
export interface RoadmapIntake {
  // Identity / where they are
  email: string;
  currentTitle: string;
  currentIndustry: string;
  yearsExperience: number;
  topSkills: string[];

  // Where they want to go
  targetRole: string;
  targetIndustry: string;

  // Constraints
  monthlyObligations: FinancialObligationBand;
  family: FamilyConstraints;
  riskTolerance: RiskTolerance;

  // Optional context carried from prior intake step
  transferableSkills?: string[];
  experienceSummary?: string;
}

export interface RoadmapPhase {
  title: string;
  summary: string;
  skillsToLearn: string[];
  certificationsToPursue: string[];
  networkingTargets: string[];
  milestones: string[];
  incomeBridgeStrategies?: string[];
  targetRole?: string;
  expectedSalaryRange?: string;
  growthTrajectory?: string;
}

export interface GeneratedRoadmap {
  executiveSummary: string;
  headlineTargetRole: string;
  headlineTargetIndustry: string;
  overallTimeframe: string;
  riskAssessment: string;
  sixMonth: RoadmapPhase;
  oneYear: RoadmapPhase;
  twoYear: RoadmapPhase;
  contingencyNotes: string;
  generatedAt: string;
}
