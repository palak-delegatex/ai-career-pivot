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

export interface ValuesAssessment {
  workStyle: string;
  topValues: string[];
  energyProfile: Record<string, number>;
  dealbreakers: string[];
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
  transferabilityScore?: number;
  transferCategory?: "direct-transfer" | "partial-transfer" | "new-skill";
  transferNote?: string;
}

export interface WeekOneAction {
  title: string;
  instruction: string;
  timeEstimate: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface MilestoneSalary {
  phase: "6-month" | "1-year" | "2-year";
  expectedSalaryRange: string;
  marketDemandLevel: "low" | "moderate" | "high" | "very-high";
  demandTrend: string;
}

export interface FinancialSummary {
  currentSalaryRange: string;
  targetSalaryRange: string;
  salaryUpliftPercent: number;
  transitionCosts: string[];
  roiTimeframe: string;
  milestoneSalaries?: MilestoneSalary[];
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

export interface RiskAssessment {
  obstacle: string;
  likelihood: number;
  impact: "high" | "medium" | "low";
  timeframe: string;
  category: "market" | "skill" | "financial" | "personal" | "industry";
  mitigationSteps: string[];
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

/**
 * Measured current-vs-target skill delta (AIC-829). Grounds the roadmap in a
 * concrete top-10 target-role skill breakdown scored against the user's actual
 * background, and maps each measured gap to the milestone that closes it — so
 * the roadmap visibly derives from the delta rather than generic output.
 */
export interface SkillDeltaSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  /** "have" = already demonstrated, "partial" = transferable/bridgeable, "gap" = learn from scratch */
  status: "have" | "partial" | "gap";
  /** Short phrase citing what in their background covers it (or why it's a gap). */
  evidence: string;
}

export interface SkillDeltaClosing {
  /** A partial/gap skill from targetTopSkills that this milestone closes. */
  gapSkill: string;
  phase: "6-month" | "1-year" | "2-year";
  /** The milestone text (verbatim from the phase list) that closes the gap. */
  milestone: string;
}

export interface SkillDelta {
  /** The 10 most important skills for the target role, ranked, each scored vs the user. */
  targetTopSkills: SkillDeltaSkill[];
  haveCount: number;
  partialCount: number;
  gapCount: number;
  /** Maps each partial/gap skill to the milestone that closes it. */
  closingMilestones: SkillDeltaClosing[];
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
  /** Measured current-vs-target skill delta driving the roadmap (AIC-829). */
  skillDelta?: SkillDelta;
  skillGaps?: SkillGap[];
  weekOneActions?: WeekOneAction[];
  estimatedTimeToTransition: string;
  financialSummary?: FinancialSummary;
  recommendedResources?: RecommendedResource[];
  aiToolkit?: AIToolkitItem[];
  riskAssessments?: RiskAssessment[];
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

export interface TransferabilityAnalysis {
  totalSkillsAssessed: number;
  directTransferCount: number;
  partialTransferCount: number;
  newSkillCount: number;
  overallTransferabilityPercent: number;
}

export interface ExtractedSkill {
  name: string;
  category: "technical" | "soft" | "domain" | "certification" | "tool";
  proficiency: "expert" | "advanced" | "intermediate" | "beginner";
  yearsUsed: number | null;
  source: string;
}

export interface TargetRoleSkill {
  name: string;
  category: "technical" | "soft" | "domain" | "certification" | "tool";
  importance: "critical" | "important" | "nice-to-have";
}

export interface DirectMatchSkill {
  userSkill: string;
  targetSkill: string;
  proficiency: string;
  matchConfidence: number;
}

export interface TransferableSkill {
  userSkill: string;
  targetSkill: string;
  transferScore: number;
  explanation: string;
  bridgeActions: string[];
}

export interface GapSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  difficultyToAcquire: "low" | "medium" | "high";
  estimatedWeeksToAcquire: number;
  learningResources: string[];
  priorityRank: number;
}

export interface SkillsEngineResult {
  userSkillGraph: ExtractedSkill[];
  targetRoleSkills: TargetRoleSkill[];
  overlapScore: number;
  directMatches: DirectMatchSkill[];
  transferableMatches: TransferableSkill[];
  gaps: GapSkill[];
  summary: {
    directMatchPercent: number;
    transferablePercent: number;
    gapPercent: number;
    readinessLabel: string;
    topTransferNarrative: string;
  };
}

export interface IntakeResult {
  profile: UserProfile;
  plans: PivotPlan[];
}
