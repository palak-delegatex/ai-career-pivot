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
  upsellOptions?: {
    premiumRoadmap: boolean;
    coachingSession: boolean;
    bundle: boolean;
  };
}

export interface IntakeResult {
  profile: UserProfile;
  plans: PivotPlan[];
}