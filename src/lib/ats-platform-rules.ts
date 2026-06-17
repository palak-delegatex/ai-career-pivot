// Platform-specific ATS scoring rules, keyword weight adjustments, and formatting guidance.
// Each ATS parses resumes differently — these rules encode known parsing behaviors.

import type { ATSPlatform } from "./ats-platform-detection";
import type { FormattingIssue } from "./ats-scoring";

export interface PlatformProfile {
  name: string;
  displayName: string;
  description: string;
  parsingBehavior: string;
  formattingTips: PlatformFormattingTip[];
  keywordStrategy: PlatformKeywordStrategy;
  scoreAdjustments: PlatformScoreAdjustments;
  bestPractices: string[];
  avoidList: string[];
}

export interface PlatformFormattingTip {
  tip: string;
  severity: "critical" | "warning" | "info";
  reason: string;
}

export interface PlatformKeywordStrategy {
  sectionWeightOverrides: Partial<Record<string, number>>;
  preferExactMatch: boolean;
  matchTypeWeightOverrides: Partial<Record<string, number>>;
  contextMatters: boolean;
  formattingWeightRatio: number;
  keywordWeightRatio: number;
}

export interface PlatformScoreAdjustments {
  formattingPenaltyMultiplier: number;
  bonusForSections: string[];
  penaltyForMissingSections: string[];
}

const PLATFORM_PROFILES: Record<Exclude<ATSPlatform, "unknown">, PlatformProfile> = {
  greenhouse: {
    name: "greenhouse",
    displayName: "Greenhouse",
    description: "Modern ATS popular with tech companies and startups. Good parsing engine with structured data extraction.",
    parsingBehavior: "Greenhouse has a solid parser that handles most formats well. It extracts structured sections and maps skills to a taxonomy. PDF parsing is generally reliable.",
    formattingTips: [
      {
        tip: "Use standard section headings (Experience, Education, Skills)",
        severity: "warning",
        reason: "Greenhouse maps sections to its internal taxonomy — non-standard headings may be miscategorized",
      },
      {
        tip: "Keep bullet points clean with standard characters (-, *)",
        severity: "info",
        reason: "Greenhouse handles most bullet types but exotic unicode bullets can cause parsing gaps",
      },
      {
        tip: "Include a dedicated Skills section with comma-separated keywords",
        severity: "warning",
        reason: "Greenhouse extracts skills into searchable tags — a clear skills section ensures all skills are indexed",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { skills: 1.0, experience: 0.95, summary: 0.8 },
      preferExactMatch: false,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.9, semantic: 0.75 },
      contextMatters: true,
      formattingWeightRatio: 0.25,
      keywordWeightRatio: 0.75,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 0.9,
      bonusForSections: ["skills", "experience", "education"],
      penaltyForMissingSections: ["skills"],
    },
    bestPractices: [
      "Include a dedicated Skills section — Greenhouse indexes these as searchable tags",
      "Use reverse chronological order for experience",
      "Match job title keywords exactly when possible",
      "PDF format works well with Greenhouse's parser",
    ],
    avoidList: [
      "Creative resume layouts with sidebars or columns",
      "Skill rating bars or visual proficiency indicators",
      "Headers and footers with important info — they may be skipped",
    ],
  },

  lever: {
    name: "lever",
    displayName: "Lever",
    description: "Collaborative hiring platform favored by mid-size tech companies. Parses resumes into a unified candidate profile.",
    parsingBehavior: "Lever parses resumes into a single candidate profile. It attempts to extract name, email, phone, current title, company, location, and links. It has decent PDF support but struggles with complex layouts.",
    formattingTips: [
      {
        tip: "Put contact information at the very top of the resume",
        severity: "critical",
        reason: "Lever looks for name and contact info in the first few lines — buried contact info causes profile creation errors",
      },
      {
        tip: "Use a simple single-column layout",
        severity: "warning",
        reason: "Lever's parser reads content top-to-bottom, left-to-right — multi-column layouts scramble the extracted text",
      },
      {
        tip: "Include LinkedIn and portfolio URLs as plain text links",
        severity: "info",
        reason: "Lever auto-detects and links social/portfolio URLs to the candidate profile",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { experience: 1.0, skills: 0.9, summary: 0.85, projects: 0.85 },
      preferExactMatch: false,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.85, semantic: 0.7 },
      contextMatters: true,
      formattingWeightRatio: 0.3,
      keywordWeightRatio: 0.7,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 1.0,
      bonusForSections: ["experience", "skills", "projects"],
      penaltyForMissingSections: ["experience"],
    },
    bestPractices: [
      "Lead with your name and title in the first two lines",
      "Lever weighs experience heavily — detail your role and impact",
      "Include project descriptions with technologies used",
      "Plain text or simple PDF formatting works best",
    ],
    avoidList: [
      "Text boxes or floating elements in Word documents",
      "Infographic-style resumes",
      "Putting contact info only in the header/footer",
    ],
  },

  workday: {
    name: "workday",
    displayName: "Workday",
    description: "Enterprise HCM platform used by Fortune 500 companies. Has a form-based application process that re-parses uploaded resumes.",
    parsingBehavior: "Workday parses resumes to pre-fill application form fields. It strips all formatting and attempts to map content into structured fields: employment history, education, skills, certifications. Tables and complex layouts are destroyed during parsing.",
    formattingTips: [
      {
        tip: "Never use tables — Workday strips them completely",
        severity: "critical",
        reason: "Workday's parser destroys table structure, merging or scrambling cell content into unreadable text",
      },
      {
        tip: "Use simple bullet lists with standard markers (-, *, or bullet points)",
        severity: "critical",
        reason: "Workday needs clear list structures to map bullet points into the correct form fields",
      },
      {
        tip: "Include explicit date ranges in MM/YYYY format",
        severity: "warning",
        reason: "Workday tries to extract start/end dates for each role — ambiguous dates cause parsing errors",
      },
      {
        tip: "List company name and job title on separate lines",
        severity: "warning",
        reason: "Workday maps these to different form fields — combining them on one line causes misparsing",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { skills: 1.0, experience: 0.9, certifications: 0.85, education: 0.7 },
      preferExactMatch: true,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.75, semantic: 0.5 },
      contextMatters: false,
      formattingWeightRatio: 0.4,
      keywordWeightRatio: 0.6,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 1.5,
      bonusForSections: ["skills", "certifications"],
      penaltyForMissingSections: ["skills", "education"],
    },
    bestPractices: [
      "Use the simplest possible formatting — Workday strips almost everything",
      "Spell out abbreviations at least once (e.g., 'Project Management Professional (PMP)')",
      "Include explicit date ranges: 'Jan 2020 - Present' format",
      "Use a dedicated Skills section with comma-separated terms",
      "DOCX format often parses better than PDF in Workday",
    ],
    avoidList: [
      "Any type of table layout — Workday destroys tables completely",
      "Multi-column layouts, sidebars, or text boxes",
      "Graphics, charts, or skill bars",
      "Headers and footers — Workday ignores them",
      "Fancy fonts or non-standard characters",
    ],
  },

  taleo: {
    name: "taleo",
    displayName: "Oracle Taleo",
    description: "Legacy enterprise ATS owned by Oracle. Used by large corporations. Has the most restrictive parsing among major ATS platforms.",
    parsingBehavior: "Taleo has one of the oldest and most rigid parsers. It uses keyword frequency counting and strict section matching. It struggles significantly with non-standard formats and often requires manual data entry to correct parsing errors.",
    formattingTips: [
      {
        tip: "Use only standard section headings: Work Experience, Education, Skills",
        severity: "critical",
        reason: "Taleo uses rigid pattern matching for section headers — creative headings cause entire sections to be missed",
      },
      {
        tip: "Avoid all decorative formatting — use plain text structure only",
        severity: "critical",
        reason: "Taleo's parser is the most formatting-sensitive of all major ATS platforms",
      },
      {
        tip: "Repeat important keywords 2-3 times across different sections",
        severity: "warning",
        reason: "Taleo uses keyword frequency counting — a single mention may not register in older Taleo configurations",
      },
      {
        tip: "Use .docx or .txt format, not PDF",
        severity: "warning",
        reason: "Taleo's PDF parser is notoriously poor — DOCX gives significantly better parsing results",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { skills: 1.0, experience: 1.0, certifications: 0.9, education: 0.8 },
      preferExactMatch: true,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.6, semantic: 0.3 },
      contextMatters: false,
      formattingWeightRatio: 0.4,
      keywordWeightRatio: 0.6,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 2.0,
      bonusForSections: ["skills", "experience", "certifications"],
      penaltyForMissingSections: ["skills", "experience", "education"],
    },
    bestPractices: [
      "Use the most standard resume format possible — Taleo rewards simplicity",
      "Include exact keyword matches from the job description",
      "Repeat critical keywords in both Skills and Experience sections",
      "Use DOCX format for best Taleo parsing results",
      "Include full spellings alongside acronyms: 'Search Engine Optimization (SEO)'",
    ],
    avoidList: [
      "PDF format — Taleo's PDF parser is unreliable",
      "Any visual formatting: tables, columns, text boxes, graphics",
      "Creative or non-standard section headings",
      "Headers and footers — completely ignored by Taleo",
      "Special characters, symbols, or decorative elements",
    ],
  },

  icims: {
    name: "icims",
    displayName: "iCIMS",
    description: "Enterprise ATS used by many Fortune 500 companies. Decent parsing with strong keyword matching but sensitive to formatting.",
    parsingBehavior: "iCIMS has a moderate parser that extracts sections and maps them to candidate profiles. It handles basic formatting but struggles with complex layouts. It uses Boolean search matching for keywords.",
    formattingTips: [
      {
        tip: "Use standard section headers and consistent formatting",
        severity: "warning",
        reason: "iCIMS maps sections by header text — inconsistent formatting causes section boundaries to be missed",
      },
      {
        tip: "Include both acronyms and full terms for technical skills",
        severity: "warning",
        reason: "iCIMS recruiters often search with Boolean queries — include 'JavaScript (JS)' style to catch both",
      },
      {
        tip: "Keep formatting simple — avoid tables, columns, and text boxes",
        severity: "critical",
        reason: "iCIMS table parsing is unreliable and can scramble resume content",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { skills: 1.0, experience: 0.9, summary: 0.8, certifications: 0.85 },
      preferExactMatch: true,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.7, semantic: 0.5 },
      contextMatters: false,
      formattingWeightRatio: 0.35,
      keywordWeightRatio: 0.65,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 1.3,
      bonusForSections: ["skills", "certifications", "experience"],
      penaltyForMissingSections: ["skills", "experience"],
    },
    bestPractices: [
      "Include both acronyms and full forms: 'Project Management Professional (PMP)'",
      "Use a clear skills section with categorized skills",
      "iCIMS supports Boolean search — match exact JD terms",
      "PDF or DOCX both work, but keep layouts simple",
    ],
    avoidList: [
      "Tables or multi-column layouts",
      "Infographic elements or skill bars",
      "Text boxes in Word documents",
      "Heavily designed resume templates",
    ],
  },

  smartrecruiters: {
    name: "smartrecruiters",
    displayName: "SmartRecruiters",
    description: "Modern cloud-based ATS with AI-powered parsing. Better at handling varied formats than legacy systems.",
    parsingBehavior: "SmartRecruiters uses AI-powered resume parsing that handles most formats reasonably well. It extracts skills, experience, education, and contact information with higher accuracy than legacy ATS. Still struggles with very creative layouts.",
    formattingTips: [
      {
        tip: "Standard formatting works best, but SmartRecruiters is more forgiving than legacy ATS",
        severity: "info",
        reason: "SmartRecruiters' AI parser handles moderate formatting complexity better than Taleo or Workday",
      },
      {
        tip: "Use clear section headings — even if creative ones sometimes parse",
        severity: "warning",
        reason: "While SmartRecruiters handles some variation, standard headings give the most reliable results",
      },
      {
        tip: "Include a summary/objective section at the top",
        severity: "info",
        reason: "SmartRecruiters uses the summary section to rank candidates for AI matching",
      },
    ],
    keywordStrategy: {
      sectionWeightOverrides: { summary: 0.9, skills: 1.0, experience: 0.95, projects: 0.8 },
      preferExactMatch: false,
      matchTypeWeightOverrides: { exact: 1.0, variant: 0.85, semantic: 0.75 },
      contextMatters: true,
      formattingWeightRatio: 0.25,
      keywordWeightRatio: 0.75,
    },
    scoreAdjustments: {
      formattingPenaltyMultiplier: 0.8,
      bonusForSections: ["summary", "skills", "experience"],
      penaltyForMissingSections: ["skills"],
    },
    bestPractices: [
      "Write a strong summary section — SmartRecruiters uses it for AI ranking",
      "Include contextual keywords, not just lists — the AI parser understands context",
      "PDF format works well with SmartRecruiters",
      "Include project descriptions that demonstrate skills in action",
    ],
    avoidList: [
      "Extremely creative layouts with unusual content flow",
      "Tables for primary resume content",
      "Embedded images or graphics as content",
    ],
  },
};

const DEFAULT_PROFILE: PlatformProfile = {
  name: "unknown",
  displayName: "Generic ATS",
  description: "ATS platform not detected. Using general best practices that work across most systems.",
  parsingBehavior: "Most ATS platforms parse resumes top-to-bottom, extract sections by headings, and index keywords for recruiter search.",
  formattingTips: [
    {
      tip: "Use simple, single-column layouts with standard section headings",
      severity: "warning",
      reason: "Maximizes compatibility across all ATS platforms",
    },
    {
      tip: "Use PDF or DOCX format",
      severity: "info",
      reason: "These formats are supported by virtually all ATS systems",
    },
  ],
  keywordStrategy: {
    sectionWeightOverrides: {},
    preferExactMatch: false,
    matchTypeWeightOverrides: {},
    contextMatters: false,
    formattingWeightRatio: 0.3,
    keywordWeightRatio: 0.7,
  },
  scoreAdjustments: {
    formattingPenaltyMultiplier: 1.0,
    bonusForSections: [],
    penaltyForMissingSections: [],
  },
  bestPractices: [
    "Use standard section headings: Experience, Education, Skills",
    "Keep formatting simple and ATS-friendly",
    "Include exact keywords from the job description",
    "Use a single-column layout",
  ],
  avoidList: [
    "Tables, columns, or complex layouts",
    "Headers and footers with critical info",
    "Images, graphics, or visual elements",
  ],
};

export function getPlatformProfile(platform: ATSPlatform): PlatformProfile {
  if (platform === "unknown") return DEFAULT_PROFILE;
  return PLATFORM_PROFILES[platform];
}

export function getPlatformFormattingIssues(
  platform: ATSPlatform,
  existingIssues: FormattingIssue[],
  fileType?: string
): FormattingIssue[] {
  const profile = getPlatformProfile(platform);
  const platformIssues: FormattingIssue[] = [];

  if (platform === "taleo" && fileType === "application/pdf") {
    platformIssues.push({
      issue: "PDF format detected — Taleo has poor PDF parsing",
      severity: "warning",
      fix: "Convert to DOCX format for significantly better parsing in Taleo. Taleo's PDF parser is known to miss content and scramble formatting.",
      category: "file_format",
    });
  }

  if (platform === "workday") {
    const hasTableIssue = existingIssues.some(
      i => i.category === "tables"
    );
    if (hasTableIssue) {
      platformIssues.push({
        issue: "Tables are critical failures in Workday",
        severity: "critical",
        fix: "Workday completely destroys table layouts during parsing. All table content will be lost or scrambled. Convert to simple bullet lists immediately.",
        category: "tables",
      });
    }
  }

  if ((platform === "taleo" || platform === "workday" || platform === "icims") && fileType !== "text/plain") {
    const hasColumnIssue = existingIssues.some(
      i => i.category === "columns"
    );
    if (hasColumnIssue) {
      platformIssues.push({
        issue: `Multi-column layouts are especially problematic for ${profile.displayName}`,
        severity: "critical",
        fix: `${profile.displayName} reads content linearly. Multi-column content will be merged into nonsensical text. Use a single-column layout.`,
        category: "columns",
      });
    }
  }

  return platformIssues;
}

export function adjustScoreForPlatform(
  platform: ATSPlatform,
  baseFormattingScore: number,
  baseKeywordScore: number,
  sectionNames: string[]
): {
  adjustedOverall: number;
  adjustedFormatting: number;
  adjustedKeyword: number;
  adjustmentNotes: string[];
} {
  const profile = getPlatformProfile(platform);
  const notes: string[] = [];

  let adjustedFormatting = baseFormattingScore;
  const formattingDeficit = 100 - baseFormattingScore;
  if (formattingDeficit > 0) {
    const multiplier = profile.scoreAdjustments.formattingPenaltyMultiplier;
    adjustedFormatting = Math.max(0, 100 - formattingDeficit * multiplier);
    if (multiplier !== 1.0) {
      notes.push(
        multiplier > 1
          ? `${profile.displayName} is stricter on formatting — penalties increased ${Math.round((multiplier - 1) * 100)}%`
          : `${profile.displayName} is more forgiving on formatting — penalties reduced ${Math.round((1 - multiplier) * 100)}%`
      );
    }
  }

  let adjustedKeyword = baseKeywordScore;
  const presentSections = new Set(sectionNames);
  let sectionBonus = 0;
  for (const section of profile.scoreAdjustments.bonusForSections) {
    if (presentSections.has(section)) {
      sectionBonus += 2;
    }
  }
  for (const section of profile.scoreAdjustments.penaltyForMissingSections) {
    if (!presentSections.has(section)) {
      adjustedKeyword = Math.max(0, adjustedKeyword - 5);
      notes.push(`Missing "${section}" section — ${profile.displayName} penalizes this`);
    }
  }
  adjustedKeyword = Math.min(100, adjustedKeyword + sectionBonus);

  const fRatio = profile.keywordStrategy.formattingWeightRatio;
  const kRatio = profile.keywordStrategy.keywordWeightRatio;
  const adjustedOverall = Math.round(adjustedFormatting * fRatio + adjustedKeyword * kRatio);

  if (fRatio !== 0.3 || kRatio !== 0.7) {
    notes.push(
      `${profile.displayName} scoring: ${Math.round(fRatio * 100)}% formatting + ${Math.round(kRatio * 100)}% keywords`
    );
  }

  return { adjustedOverall, adjustedFormatting, adjustedKeyword, adjustmentNotes: notes };
}
