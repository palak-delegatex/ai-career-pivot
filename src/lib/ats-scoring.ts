// Deterministic ATS scoring engine with formatting checks and weighted keyword matching.
// LLM is used only for semantic gap analysis; all formatting and keyword matching is algorithmic.

// ── Types ────────────────────────────────────────────────────────────────────

export interface FormattingIssue {
  issue: string;
  severity: "critical" | "warning" | "minor";
  fix: string;
  category: "tables" | "images" | "fonts" | "headers" | "columns" | "characters" | "length" | "file_format";
}

export interface KeywordMatch {
  keyword: string;
  matched: boolean;
  matchType: "exact" | "variant" | "semantic" | null;
  foundIn: string[];
  weight: number;
  category: "required" | "preferred" | "keyword";
  suggestedSection: string | null;
  frequency: number;
  skillType: "hard" | "soft" | "other";
}

export interface SectionScore {
  section: string;
  present: boolean;
  keywordsFound: string[];
  keywordsMissing: string[];
  coverage: number;
}

export interface MatchRateBreakdown {
  overallScore: number;
  formattingScore: number;
  keywordScore: number;
  formattingIssues: FormattingIssue[];
  keywordMatches: KeywordMatch[];
  sectionScores: SectionScore[];
  summary: {
    totalKeywords: number;
    matchedKeywords: number;
    missingKeywords: number;
    exactMatches: number;
    variantMatches: number;
    semanticMatches: number;
    requiredHit: number;
    requiredTotal: number;
    preferredHit: number;
    preferredTotal: number;
  };
}

export interface ParsedSection {
  name: string;
  normalizedName: string;
  content: string;
  startIndex: number;
}

export interface JDKeywords {
  required: string[];
  preferred: string[];
  keywords: string[];
}

export interface EnrichedJDKeywords extends JDKeywords {
  hardSkills: string[];
  softSkills: string[];
  jobTitle: string;
}

// ── Multi-Dimensional Scoring Types ─────────────────────────────────────────

export interface CategoryCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
  fix: string | null;
}

export interface CategoryScore {
  name: string;
  key: "hard_skills" | "soft_skills" | "keyword_density" | "searchability" | "formatting" | "recruiter_tips";
  score: number;
  weight: number;
  checks: CategoryCheck[];
}

export interface SearchabilityResult {
  score: number;
  checks: CategoryCheck[];
  contactFields: { email: boolean; phone: boolean; location: boolean; linkedin: boolean; name: boolean };
  standardHeadings: { heading: string; present: boolean }[];
  jobTitleMatch: boolean;
  dateFormatConsistent: boolean;
}

export interface RecruiterTipsResult {
  score: number;
  checks: CategoryCheck[];
  actionVerbRate: number;
  measurableResultRate: number;
  totalBullets: number;
  bulletsWithMetrics: number;
  bulletsWithActionVerbs: number;
  firstPersonCount: number;
  estimatedPages: number;
}

export interface KeywordDensityResult {
  score: number;
  checks: CategoryCheck[];
  keywordFrequencies: { keyword: string; count: number; optimal: boolean; skillType: "hard" | "soft" | "other" }[];
}

export interface MultiDimensionalATSResult {
  overallScore: number;
  scoreLabel: "Excellent" | "Good" | "Needs Work" | "Poor";
  categoryScores: CategoryScore[];
  hardSkillsResult: { score: number; matched: KeywordMatch[]; missing: KeywordMatch[] };
  softSkillsResult: { score: number; matched: KeywordMatch[]; missing: KeywordMatch[] };
  keywordDensity: KeywordDensityResult;
  searchability: SearchabilityResult;
  formatting: { score: number; issues: FormattingIssue[] };
  recruiterTips: RecruiterTipsResult;
  keywordMatches: KeywordMatch[];
  sectionScores: SectionScore[];
  summary: MatchRateBreakdown["summary"];
}

// ── Constants ────────────────────────────────────────────────────────────────

const SECTION_HEADINGS: Record<string, string[]> = {
  contact: ["contact", "personal information", "personal details"],
  summary: ["summary", "objective", "professional summary", "career summary", "profile", "about me", "career objective"],
  experience: ["experience", "work experience", "professional experience", "employment history", "work history", "employment"],
  education: ["education", "academic background", "academic history", "qualifications"],
  skills: ["skills", "technical skills", "core competencies", "competencies", "areas of expertise", "proficiencies", "technologies"],
  certifications: ["certifications", "certificates", "licenses", "credentials", "professional development"],
  projects: ["projects", "key projects", "selected projects"],
  awards: ["awards", "honors", "achievements", "recognition"],
  publications: ["publications", "research"],
  volunteer: ["volunteer", "volunteering", "community involvement"],
};

const SECTION_KEYWORD_WEIGHT: Record<string, number> = {
  skills: 1.0,
  experience: 0.9,
  summary: 0.8,
  projects: 0.8,
  certifications: 0.7,
  education: 0.6,
  awards: 0.5,
  contact: 0.3,
  unknown: 0.4,
};

const MATCH_TYPE_WEIGHT: Record<string, number> = {
  exact: 1.0,
  variant: 0.8,
  semantic: 0.5,
};

const SKILL_VARIANTS: Record<string, string[]> = {
  javascript: ["js", "javascript", "ecmascript", "es6", "es2015"],
  typescript: ["ts", "typescript"],
  python: ["python", "py"],
  "react": ["react", "reactjs", "react.js"],
  "node.js": ["node", "nodejs", "node.js"],
  "vue.js": ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs"],
  "machine learning": ["ml", "machine learning"],
  "artificial intelligence": ["ai", "artificial intelligence"],
  "natural language processing": ["nlp", "natural language processing"],
  "deep learning": ["dl", "deep learning"],
  "data science": ["data science", "data scientist"],
  "data analysis": ["data analysis", "analytics", "data analytics"],
  "project management": ["pm", "project management", "pmp"],
  "product management": ["product management", "product manager"],
  "user experience": ["ux", "user experience", "ux design"],
  "user interface": ["ui", "user interface", "ui design"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  devops: ["devops", "dev ops"],
  kubernetes: ["kubernetes", "k8s"],
  docker: ["docker", "containerization"],
  aws: ["aws", "amazon web services"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  azure: ["azure", "microsoft azure"],
  sql: ["sql", "mysql", "postgresql", "postgres", "mssql"],
  nosql: ["nosql", "mongodb", "dynamodb", "cassandra", "redis"],
  agile: ["agile", "scrum", "kanban"],
  "rest api": ["rest", "restful", "rest api", "restful api"],
  graphql: ["graphql", "gql"],
  terraform: ["terraform", "iac", "infrastructure as code"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp", "c sharp"],
  ".net": [".net", "dotnet", "asp.net"],
  java: ["java", "jvm"],
  go: ["go", "golang"],
  rust: ["rust"],
  swift: ["swift", "ios development"],
  kotlin: ["kotlin", "android development"],
  figma: ["figma"],
  sketch: ["sketch"],
  jira: ["jira"],
  confluence: ["confluence"],
  tableau: ["tableau"],
  "power bi": ["power bi", "powerbi"],
  excel: ["excel", "spreadsheet", "ms excel"],
  salesforce: ["salesforce", "sfdc"],
  sap: ["sap"],
};

const ATS_UNFRIENDLY_FONTS = [
  "comic sans", "papyrus", "brush script", "impact", "copperplate",
  "curlz", "jokerman", "chiller", "kristen", "snap itc", "viner hand",
  "lucida handwriting", "mistral", "ravie", "playbill", "harlow",
];

const FANCY_CHARS = /[•‣◦⁃∙▪▫●○■□♦♥♣♠❖✧✨✩✪✰✱✲✳✴✵✶✷✸✹✺✻✼✽❋❍❈❉❂❃❄❅❆❇▶◀▲▼★☆✓✔✕✖✗✘•]/g;

// ── Section Parser ───────────────────────────────────────────────────────────

export function parseResumeIntoSections(text: string): ParsedSection[] {
  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  const headingPattern = /^(?:#{1,3}\s+)?([A-Z][A-Za-z\s&/,]+(?:Experience|Skills|Education|Summary|Objective|Projects|Certifications?|Awards?|Publications?|Contact|Profile|Competencies|Qualifications|History|Details|Background|Expertise|Technologies|Development|Licenses|Credentials|Honors|Recognition|Involvement|Achievements)?)\s*$/;
  const allCapsPattern = /^([A-Z][A-Z\s&/,]{3,})$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let detectedSection: string | null = null;
    const headingMatch = line.match(headingPattern) || line.match(allCapsPattern);

    if (headingMatch) {
      const candidate = headingMatch[1].trim().toLowerCase();
      for (const [sectionKey, aliases] of Object.entries(SECTION_HEADINGS)) {
        if (aliases.some(a => candidate.includes(a) || a.includes(candidate))) {
          detectedSection = sectionKey;
          break;
        }
      }
      if (!detectedSection && headingMatch[0].match(allCapsPattern)) {
        detectedSection = "unknown";
      }
    }

    if (detectedSection) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        name: line.replace(/^#{1,3}\s+/, "").trim(),
        normalizedName: detectedSection,
        content: "",
        startIndex: i,
      };
    } else if (currentSection) {
      currentSection.content += line + "\n";
    } else {
      if (!sections.length && !currentSection) {
        currentSection = {
          name: "Header",
          normalizedName: "contact",
          content: line + "\n",
          startIndex: i,
        };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// ── Formatting Checks ────────────────────────────────────────────────────────

export function detectFormattingIssues(text: string, fileType?: string): FormattingIssue[] {
  const issues: FormattingIssue[] = [];

  if (/<table[\s>]/i.test(text) || /<tr[\s>]/i.test(text) || /<td[\s>]/i.test(text)) {
    issues.push({
      issue: "HTML tables detected",
      severity: "critical",
      fix: "Remove all HTML table markup and use plain text with clear section headings instead. Most ATS systems cannot parse table cells correctly.",
      category: "tables",
    });
  }

  const mdTableLines = text.split("\n").filter(l => /^\s*\|.*\|.*\|/.test(l));
  if (mdTableLines.length >= 2) {
    issues.push({
      issue: "Markdown/text tables detected",
      severity: "critical",
      fix: "Replace table layouts with simple bulleted lists. ATS parsers read left-to-right, top-to-bottom and scramble table content.",
      category: "tables",
    });
  }

  const tabColumnLines = text.split("\n").filter(l => {
    const tabs = (l.match(/\t/g) || []).length;
    return tabs >= 2 && l.trim().length > 10;
  });
  if (tabColumnLines.length >= 3) {
    issues.push({
      issue: "Tab-separated columns detected (multi-column layout)",
      severity: "warning",
      fix: "Replace multi-column layouts with single-column format. ATS parsers may merge or scramble column content.",
      category: "columns",
    });
  }

  if (/<img[\s>]/i.test(text) || /data:image\//i.test(text)) {
    issues.push({
      issue: "Embedded images detected",
      severity: "critical",
      fix: "Remove all images, logos, and graphics. ATS systems cannot read image content and they can break document parsing.",
      category: "images",
    });
  }

  if (/\.(png|jpg|jpeg|gif|svg|bmp|ico)\b/i.test(text)) {
    issues.push({
      issue: "Image file references found",
      severity: "warning",
      fix: "Remove image references. If these are profile photos or icons, ATS cannot process them.",
      category: "images",
    });
  }

  const fontMatches = text.toLowerCase().match(/font-family:\s*['"]?([^;'"]+)/gi) || [];
  for (const fontDecl of fontMatches) {
    const fontName = fontDecl.replace(/font-family:\s*['"]?/i, "").toLowerCase();
    if (ATS_UNFRIENDLY_FONTS.some(f => fontName.includes(f))) {
      issues.push({
        issue: `Non-standard font detected: ${fontName.trim()}`,
        severity: "warning",
        fix: "Use ATS-safe fonts: Arial, Calibri, Cambria, Garamond, Georgia, Helvetica, or Times New Roman.",
        category: "fonts",
      });
    }
  }

  if (/<header[\s>]/i.test(text) || /<footer[\s>]/i.test(text)) {
    issues.push({
      issue: "HTML header/footer elements detected",
      severity: "warning",
      fix: "Move header/footer content into the main document body. Many ATS systems skip header and footer regions entirely.",
      category: "headers",
    });
  }

  const fancyCharCount = (text.match(FANCY_CHARS) || []).length;
  if (fancyCharCount > 5) {
    issues.push({
      issue: `${fancyCharCount} special/decorative characters found`,
      severity: "minor",
      fix: "Replace decorative bullets and symbols with standard characters (-, *, or plain bullets). Some ATS systems strip or misread unicode symbols.",
      category: "characters",
    });
  }

  if (/[‘’“”]/g.test(text)) {
    issues.push({
      issue: "Smart quotes (curly quotes) detected",
      severity: "minor",
      fix: "Replace smart quotes with straight quotes. Some older ATS parsers misread curly quote characters.",
      category: "characters",
    });
  }

  if (/column-count|column-width|float:\s*(left|right)/i.test(text)) {
    issues.push({
      issue: "CSS multi-column or float layout detected",
      severity: "critical",
      fix: "Use a single-column layout. CSS columns and floats cause ATS parsers to merge or reorder content incorrectly.",
      category: "columns",
    });
  }

  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 15) {
    issues.push({
      issue: "Resume appears too short (under 15 content lines)",
      severity: "warning",
      fix: "Add more detail to work experience, skills, and achievements. Short resumes score lower in ATS keyword matching.",
      category: "length",
    });
  } else if (lines.length > 200) {
    issues.push({
      issue: "Resume is very long (over 200 content lines)",
      severity: "minor",
      fix: "Consider condensing to 1-2 pages. Very long resumes can timeout some ATS parsers and dilute keyword density.",
      category: "length",
    });
  }

  if (fileType && !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(fileType)) {
    issues.push({
      issue: `File format may not be ATS-compatible: ${fileType}`,
      severity: "warning",
      fix: "Use PDF or DOCX format. These are the most widely supported by ATS systems.",
      category: "file_format",
    });
  }

  return issues;
}

// ── Keyword Matching ─────────────────────────────────────────────────────────

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function getVariants(keyword: string): string[] {
  const normalized = normalizeForMatch(keyword);
  const variants = new Set<string>([normalized]);

  for (const [_canonical, alts] of Object.entries(SKILL_VARIANTS)) {
    if (alts.some(a => a === normalized || normalized.includes(a) || a.includes(normalized))) {
      for (const alt of alts) variants.add(alt);
    }
  }

  if (normalized.includes(" ")) {
    for (const word of normalized.split(" ")) {
      if (word.length > 2) variants.add(word);
    }
  }

  const noSpaces = normalized.replace(/\s+/g, "");
  if (noSpaces !== normalized) variants.add(noSpaces);
  const noDots = normalized.replace(/\./g, "");
  if (noDots !== normalized) variants.add(noDots);

  return [...variants];
}

function findKeywordInText(keyword: string, text: string): { found: boolean; matchType: "exact" | "variant" | null } {
  const normalizedText = normalizeForMatch(text);
  const normalizedKw = normalizeForMatch(keyword);

  if (normalizedText.includes(normalizedKw)) {
    return { found: true, matchType: "exact" };
  }

  const wordBoundary = new RegExp(`\\b${normalizedKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  if (wordBoundary.test(normalizedText)) {
    return { found: true, matchType: "exact" };
  }

  const variants = getVariants(keyword);
  for (const variant of variants) {
    if (variant === normalizedKw) continue;
    if (normalizedText.includes(variant)) {
      return { found: true, matchType: "variant" };
    }
    const variantBoundary = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (variantBoundary.test(normalizedText)) {
      return { found: true, matchType: "variant" };
    }
  }

  return { found: false, matchType: null };
}

const BEST_SECTION_FOR_KEYWORD: Record<string, string> = {
  required: "Skills or Experience",
  preferred: "Skills",
  keyword: "Summary or Experience",
};

export function matchKeywordsAgainstResume(
  jdKeywords: JDKeywords,
  sections: ParsedSection[],
  semanticMatches?: string[],
  enriched?: EnrichedJDKeywords
): KeywordMatch[] {
  const results: KeywordMatch[] = [];
  const semanticSet = new Set((semanticMatches || []).map(s => normalizeForMatch(s)));
  const hardSkillSet = new Set((enriched?.hardSkills || []).map(s => normalizeForMatch(s)));
  const softSkillSet = new Set((enriched?.softSkills || []).map(s => normalizeForMatch(s)));
  const fullText = sections.map(s => s.content).join("\n");

  function classifySkillType(keyword: string): "hard" | "soft" | "other" {
    const norm = normalizeForMatch(keyword);
    if (hardSkillSet.has(norm)) return "hard";
    if (softSkillSet.has(norm)) return "soft";
    if (SKILL_VARIANTS[norm] || Object.values(SKILL_VARIANTS).some(v => v.includes(norm))) return "hard";
    return "other";
  }

  function processKeyword(keyword: string, category: "required" | "preferred" | "keyword") {
    const foundIn: string[] = [];
    let bestMatchType: "exact" | "variant" | "semantic" | null = null;
    let bestWeight = 0;

    for (const section of sections) {
      const { found, matchType } = findKeywordInText(keyword, section.content);
      if (found && matchType) {
        foundIn.push(section.name);
        const sectionWeight = SECTION_KEYWORD_WEIGHT[section.normalizedName] ?? SECTION_KEYWORD_WEIGHT.unknown;
        const typeWeight = MATCH_TYPE_WEIGHT[matchType];
        const combinedWeight = sectionWeight * typeWeight;
        if (combinedWeight > bestWeight) {
          bestWeight = combinedWeight;
          bestMatchType = matchType;
        }
      }
    }

    if (!bestMatchType && semanticSet.has(normalizeForMatch(keyword))) {
      bestMatchType = "semantic";
      bestWeight = MATCH_TYPE_WEIGHT.semantic;
    }

    results.push({
      keyword,
      matched: bestMatchType !== null,
      matchType: bestMatchType,
      foundIn,
      weight: bestWeight,
      category,
      suggestedSection: bestMatchType ? null : BEST_SECTION_FOR_KEYWORD[category],
      frequency: countKeywordOccurrences(keyword, fullText),
      skillType: classifySkillType(keyword),
    });
  }

  for (const kw of jdKeywords.required) processKeyword(kw, "required");
  for (const kw of jdKeywords.preferred) processKeyword(kw, "preferred");
  for (const kw of jdKeywords.keywords) processKeyword(kw, "keyword");

  return results;
}

// ── Keyword Frequency Counter ───────────────────────────────────────────────

function countKeywordOccurrences(keyword: string, text: string): number {
  const normalizedText = normalizeForMatch(text);
  const normalizedKw = normalizeForMatch(keyword);
  let count = 0;

  const escaped = normalizedKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  const matches = normalizedText.match(regex);
  if (matches) count += matches.length;

  if (count === 0) {
    const variants = getVariants(keyword);
    for (const variant of variants) {
      if (variant === normalizedKw) continue;
      const variantEscaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const variantRegex = new RegExp(`\\b${variantEscaped}\\b`, "gi");
      const variantMatches = normalizedText.match(variantRegex);
      if (variantMatches) count += variantMatches.length;
    }
  }

  return count;
}

export function analyzeKeywordDensity(
  keywordMatches: KeywordMatch[],
  resumeText: string
): KeywordDensityResult {
  const checks: CategoryCheck[] = [];
  const keywordFrequencies: KeywordDensityResult["keywordFrequencies"] = [];

  for (const match of keywordMatches) {
    const count = countKeywordOccurrences(match.keyword, resumeText);
    const optimal = count >= 1 && count <= 8;
    keywordFrequencies.push({
      keyword: match.keyword,
      count,
      optimal,
      skillType: match.skillType,
    });
  }

  const present = keywordFrequencies.filter(k => k.count > 0);
  const missing = keywordFrequencies.filter(k => k.count === 0);
  const overused = keywordFrequencies.filter(k => k.count > 8);
  const optimalCount = keywordFrequencies.filter(k => k.optimal).length;

  const presenceRate = keywordFrequencies.length > 0
    ? present.length / keywordFrequencies.length
    : 0;

  checks.push({
    name: "Keyword presence",
    passed: presenceRate >= 0.5,
    score: Math.round(presenceRate * 40),
    maxScore: 40,
    detail: `${present.length}/${keywordFrequencies.length} keywords found in resume`,
    fix: missing.length > 0 ? `Add missing keywords: ${missing.slice(0, 5).map(k => k.keyword).join(", ")}` : null,
  });

  const optimalRate = keywordFrequencies.length > 0
    ? optimalCount / keywordFrequencies.length
    : 0;
  checks.push({
    name: "Optimal frequency range",
    passed: optimalRate >= 0.6,
    score: Math.round(optimalRate * 30),
    maxScore: 30,
    detail: `${optimalCount}/${keywordFrequencies.length} keywords appear 1-8 times (optimal range)`,
    fix: optimalRate < 0.6 ? "Ensure each keyword appears at least once but not more than 8 times" : null,
  });

  const multiSectionKeywords = present.filter(k => {
    const match = keywordMatches.find(m => m.keyword === k.keyword);
    return match && match.foundIn.length >= 2;
  });
  const distributionRate = present.length > 0
    ? multiSectionKeywords.length / present.length
    : 0;
  checks.push({
    name: "Keyword distribution across sections",
    passed: distributionRate >= 0.3,
    score: Math.round(distributionRate * 20),
    maxScore: 20,
    detail: `${multiSectionKeywords.length} keywords appear in multiple sections`,
    fix: distributionRate < 0.3 ? "Reinforce key skills by mentioning them in both Skills and Experience sections" : null,
  });

  checks.push({
    name: "No keyword stuffing",
    passed: overused.length === 0,
    score: overused.length === 0 ? 10 : Math.max(0, 10 - overused.length * 3),
    maxScore: 10,
    detail: overused.length === 0
      ? "No keywords appear excessively"
      : `${overused.length} keywords appear too many times: ${overused.map(k => `${k.keyword} (${k.count}x)`).join(", ")}`,
    fix: overused.length > 0 ? "Reduce repetition of over-used keywords to appear naturally (1-5 times)" : null,
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  return { score: totalScore, checks, keywordFrequencies };
}

// ── Searchability Analysis ──────────────────────────────────────────────────

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/in\//i;
const LOCATION_RE = /\b(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b|\b\d{5}(?:-\d{4})?\b/;
const DATE_FORMATS = [
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
  /\b\d{1,2}\/\d{4}\b/g,
  /\b\d{4}\s*[-–]\s*(?:\d{4}|present|current)\b/gi,
];

const REQUIRED_HEADINGS = [
  { heading: "Experience", aliases: ["experience", "work experience", "professional experience", "employment"] },
  { heading: "Education", aliases: ["education", "academic"] },
  { heading: "Skills", aliases: ["skills", "technical skills", "core competencies", "competencies"] },
  { heading: "Summary", aliases: ["summary", "objective", "professional summary", "profile"] },
  { heading: "Contact", aliases: ["contact", "personal information"] },
];

export function analyzeSearchability(
  resumeText: string,
  sections: ParsedSection[],
  jobTitle?: string
): SearchabilityResult {
  const checks: CategoryCheck[] = [];
  const textLower = resumeText.toLowerCase();

  const contactFields = {
    email: EMAIL_RE.test(resumeText),
    phone: PHONE_RE.test(resumeText),
    location: LOCATION_RE.test(resumeText),
    linkedin: LINKEDIN_RE.test(resumeText),
    name: sections.some(s => s.normalizedName === "contact" && s.content.trim().length > 0) || resumeText.split("\n")[0]?.trim().length > 2,
  };

  const contactCount = Object.values(contactFields).filter(Boolean).length;
  checks.push({
    name: "Contact information completeness",
    passed: contactCount >= 4,
    score: Math.min(20, contactCount * 4),
    maxScore: 20,
    detail: `${contactCount}/5 contact fields found (${Object.entries(contactFields).filter(([, v]) => !v).map(([k]) => k).join(", ") || "all present"})`,
    fix: contactCount < 4 ? `Add missing: ${Object.entries(contactFields).filter(([, v]) => !v).map(([k]) => k).join(", ")}` : null,
  });

  const standardHeadings = REQUIRED_HEADINGS.map(({ heading, aliases }) => {
    const present = sections.some(s =>
      aliases.some(a => s.normalizedName === a || s.name.toLowerCase().includes(a))
    );
    return { heading, present };
  });

  const headingCount = standardHeadings.filter(h => h.present).length;
  checks.push({
    name: "Standard ATS section headings",
    passed: headingCount >= 4,
    score: Math.min(25, headingCount * 5),
    maxScore: 25,
    detail: `${headingCount}/${REQUIRED_HEADINGS.length} standard sections found`,
    fix: headingCount < 4
      ? `Add missing sections: ${standardHeadings.filter(h => !h.present).map(h => h.heading).join(", ")}`
      : null,
  });

  const hasNonStandardHeadings = sections.some(s =>
    s.normalizedName === "unknown" &&
    !REQUIRED_HEADINGS.some(r => r.aliases.some(a => s.name.toLowerCase().includes(a)))
  );
  checks.push({
    name: "No creative/non-standard headings",
    passed: !hasNonStandardHeadings,
    score: hasNonStandardHeadings ? 5 : 10,
    maxScore: 10,
    detail: hasNonStandardHeadings
      ? "Some section headings may not be recognized by ATS parsers"
      : "All headings use standard ATS-recognized names",
    fix: hasNonStandardHeadings ? 'Rename creative headings to standard ones (e.g. "What I Do" → "Experience")' : null,
  });

  let jobTitleMatch = false;
  if (jobTitle) {
    const normalizedTitle = normalizeForMatch(jobTitle);
    const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = titleWords.filter(w => textLower.includes(w));
    jobTitleMatch = matchedWords.length >= Math.ceil(titleWords.length * 0.6);
    checks.push({
      name: "Job title match",
      passed: jobTitleMatch,
      score: jobTitleMatch ? 25 : 0,
      maxScore: 25,
      detail: jobTitleMatch
        ? `Target job title "${jobTitle}" found in resume`
        : `Target job title "${jobTitle}" not found — ATS often filters by exact title match`,
      fix: jobTitleMatch ? null : `Add "${jobTitle}" to your Summary or Experience section headings`,
    });
  } else {
    checks.push({
      name: "Job title match",
      passed: false,
      score: 10,
      maxScore: 25,
      detail: "No target job title to compare (standalone mode)",
      fix: null,
    });
  }

  let dateFormatConsistent = true;
  const dateMatches: string[] = [];
  for (const re of DATE_FORMATS) {
    const matches = resumeText.match(re);
    if (matches) dateMatches.push(...matches);
  }
  if (dateMatches.length >= 2) {
    const hasMonth = dateMatches.some(d => /[A-Za-z]/.test(d));
    const hasNumeric = dateMatches.some(d => /^\d+\/\d+$/.test(d));
    dateFormatConsistent = !(hasMonth && hasNumeric);
  }
  checks.push({
    name: "Consistent date formatting",
    passed: dateFormatConsistent,
    score: dateFormatConsistent ? 10 : 3,
    maxScore: 10,
    detail: dateFormatConsistent
      ? "Date formats are consistent throughout"
      : "Mixed date formats detected (e.g. 'Jan 2024' and '01/2024')",
    fix: dateFormatConsistent ? null : 'Use a single date format throughout (recommended: "Month Year" like "Jan 2024")',
  });

  const reverseChrono = checkReverseChronological(sections);
  checks.push({
    name: "Reverse chronological order",
    passed: reverseChrono,
    score: reverseChrono ? 10 : 2,
    maxScore: 10,
    detail: reverseChrono
      ? "Experience appears in reverse chronological order"
      : "Experience may not be in reverse chronological order — most ATS systems expect this",
    fix: reverseChrono ? null : "Reorder experience entries with the most recent position first",
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
  const normalizedScore = Math.round((totalScore / maxScore) * 100);

  return {
    score: normalizedScore,
    checks,
    contactFields,
    standardHeadings,
    jobTitleMatch,
    dateFormatConsistent,
  };
}

function checkReverseChronological(sections: ParsedSection[]): boolean {
  const expSection = sections.find(s => s.normalizedName === "experience");
  if (!expSection) return true;

  const years: number[] = [];
  const yearRe = /\b(20\d{2}|19\d{2})\b/g;
  let match;
  while ((match = yearRe.exec(expSection.content)) !== null) {
    years.push(parseInt(match[1]));
  }
  if (years.length < 2) return true;

  let descCount = 0;
  for (let i = 1; i < years.length; i++) {
    if (years[i] <= years[i - 1]) descCount++;
  }
  return descCount / (years.length - 1) >= 0.5;
}

// ── Recruiter Tips Analysis ─────────────────────────────────────────────────

const ACTION_VERBS = new Set([
  "achieved", "accelerated", "accomplished", "administered", "advised", "analyzed",
  "architected", "assembled", "automated", "boosted", "built", "championed",
  "coached", "collaborated", "compiled", "completed", "conducted", "consolidated",
  "constructed", "consulted", "converted", "coordinated", "created", "cultivated",
  "customized", "decreased", "delivered", "demonstrated", "designed", "developed",
  "devised", "directed", "drove", "earned", "eliminated", "enabled", "engineered",
  "enhanced", "established", "evaluated", "exceeded", "executed", "expanded",
  "expedited", "facilitated", "finalized", "formulated", "founded", "generated",
  "grew", "guided", "headed", "identified", "implemented", "improved", "increased",
  "influenced", "initiated", "innovated", "integrated", "introduced", "invented",
  "launched", "led", "leveraged", "managed", "maximized", "mentored", "migrated",
  "minimized", "modernized", "monitored", "negotiated", "operated", "optimized",
  "orchestrated", "organized", "outperformed", "overhauled", "oversaw", "partnered",
  "performed", "piloted", "pioneered", "planned", "presented", "prioritized",
  "produced", "programmed", "proposed", "provided", "published", "recommended",
  "reconciled", "redesigned", "reduced", "refined", "refactored", "remodeled",
  "reorganized", "replaced", "reported", "researched", "resolved", "restructured",
  "revamped", "revitalized", "saved", "scaled", "secured", "simplified",
  "spearheaded", "standardized", "steered", "streamlined", "strengthened",
  "supervised", "surpassed", "synchronized", "systematized", "trained",
  "transformed", "translated", "troubleshot", "unified", "upgraded", "utilized",
  "validated", "verified", "volunteered",
]);

const METRIC_RE = /\b(\d+[%$kKmMbB]|\$[\d,.]+|[\d,.]+\s*(?:percent|%|users|clients|customers|projects|team members|employees|revenue|savings|hours|days|weeks|months|years|increase|decrease|reduction|growth|improvement))\b/i;
const FIRST_PERSON_RE = /\b(I|me|my|mine|myself)\b/gi;
const WEAK_PHRASES_RE = /\b(responsible for|duties include|helped with|assisted with|worked on|tasked with|in charge of)\b/gi;

export function analyzeRecruiterTips(
  resumeText: string,
  sections: ParsedSection[]
): RecruiterTipsResult {
  const checks: CategoryCheck[] = [];
  const lines = resumeText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const bulletLines = lines.filter(l =>
    /^[-•▪*]\s/.test(l) || /^\d+[.)]\s/.test(l) || /^[A-Z][a-z].*(?:ed|ing|ied)\b/.test(l)
  );
  const experienceSection = sections.find(s => s.normalizedName === "experience");
  const expBullets = experienceSection
    ? experienceSection.content.split("\n").map(l => l.trim()).filter(l =>
        l.length > 10 && (/^[-•▪*]\s/.test(l) || /^\d+[.)]\s/.test(l) || /^[A-Z][a-z]/.test(l))
      )
    : bulletLines;
  const totalBullets = Math.max(expBullets.length, 1);

  let bulletsWithActionVerbs = 0;
  for (const bullet of expBullets) {
    const firstWord = bullet.replace(/^[-•▪*\d.)]+\s*/, "").split(/\s+/)[0]?.toLowerCase();
    if (firstWord && ACTION_VERBS.has(firstWord)) bulletsWithActionVerbs++;
  }
  const actionVerbRate = bulletsWithActionVerbs / totalBullets;
  checks.push({
    name: "Action verbs",
    passed: actionVerbRate >= 0.5,
    score: Math.round(Math.min(1, actionVerbRate / 0.7) * 25),
    maxScore: 25,
    detail: `${bulletsWithActionVerbs}/${totalBullets} bullet points start with strong action verbs (${Math.round(actionVerbRate * 100)}%)`,
    fix: actionVerbRate < 0.5
      ? 'Start each bullet with a past-tense action verb (e.g. "Developed", "Increased", "Led")'
      : null,
  });

  let bulletsWithMetrics = 0;
  for (const bullet of expBullets) {
    if (METRIC_RE.test(bullet)) bulletsWithMetrics++;
  }
  const measurableResultRate = bulletsWithMetrics / totalBullets;
  checks.push({
    name: "Measurable results",
    passed: measurableResultRate >= 0.4,
    score: Math.round(Math.min(1, measurableResultRate / 0.5) * 25),
    maxScore: 25,
    detail: `${bulletsWithMetrics}/${totalBullets} bullets include quantifiable metrics (${Math.round(measurableResultRate * 100)}%)`,
    fix: measurableResultRate < 0.4
      ? 'Add numbers to achievements: revenue, percentages, team size, time saved (e.g. "Reduced load time by 40%")'
      : null,
  });

  const firstPersonMatches = resumeText.match(FIRST_PERSON_RE) || [];
  const firstPersonCount = firstPersonMatches.length;
  checks.push({
    name: "No first-person pronouns",
    passed: firstPersonCount === 0,
    score: firstPersonCount === 0 ? 15 : Math.max(0, 15 - firstPersonCount * 2),
    maxScore: 15,
    detail: firstPersonCount === 0
      ? "No first-person pronouns found — professional tone"
      : `${firstPersonCount} first-person pronouns found ("I", "my", etc.)`,
    fix: firstPersonCount > 0 ? 'Remove "I", "my", "me" — use implied first person (e.g. "Managed team" not "I managed the team")' : null,
  });

  const weakPhrases = resumeText.match(WEAK_PHRASES_RE) || [];
  checks.push({
    name: "No weak/passive phrases",
    passed: weakPhrases.length === 0,
    score: weakPhrases.length === 0 ? 10 : Math.max(0, 10 - weakPhrases.length * 2),
    maxScore: 10,
    detail: weakPhrases.length === 0
      ? "No weak phrases like 'responsible for' detected"
      : `${weakPhrases.length} weak phrases found: ${[...new Set(weakPhrases.map(p => p.toLowerCase()))].slice(0, 3).join(", ")}`,
    fix: weakPhrases.length > 0 ? 'Replace "responsible for X" with action verbs: "Managed X", "Led X", "Delivered X"' : null,
  });

  const wordCount = resumeText.split(/\s+/).length;
  const estimatedPages = wordCount / 500;
  const goodLength = estimatedPages >= 0.8 && estimatedPages <= 2.5;
  checks.push({
    name: "Appropriate resume length",
    passed: goodLength,
    score: goodLength ? 15 : (estimatedPages < 0.5 || estimatedPages > 4 ? 3 : 8),
    maxScore: 15,
    detail: `~${Math.round(estimatedPages * 10) / 10} pages estimated (${wordCount} words)`,
    fix: !goodLength
      ? estimatedPages < 0.8
        ? "Resume is too short — expand experience descriptions with specific achievements and metrics"
        : "Resume may be too long — aim for 1-2 pages by cutting older or less relevant experience"
      : null,
  });

  const bulletLength = expBullets.filter(b => {
    const words = b.split(/\s+/).length;
    return words >= 8 && words <= 30;
  });
  const bulletLengthRate = totalBullets > 0 ? bulletLength.length / totalBullets : 0;
  checks.push({
    name: "Bullet point length",
    passed: bulletLengthRate >= 0.6,
    score: Math.round(bulletLengthRate * 10),
    maxScore: 10,
    detail: `${bulletLength.length}/${totalBullets} bullets are optimal length (1-2 lines)`,
    fix: bulletLengthRate < 0.6 ? "Aim for 1-2 lines per bullet point — detailed enough to be meaningful, concise enough to scan" : null,
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
  const normalizedScore = Math.round((totalScore / maxScore) * 100);

  return {
    score: normalizedScore,
    checks,
    actionVerbRate,
    measurableResultRate,
    totalBullets,
    bulletsWithMetrics,
    bulletsWithActionVerbs,
    firstPersonCount,
    estimatedPages,
  };
}

// ── Score Computation ────────────────────────────────────────────────────────

function computeFormattingScore(issues: FormattingIssue[]): number {
  let penalty = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical": penalty += 15; break;
      case "warning": penalty += 7; break;
      case "minor": penalty += 3; break;
    }
  }
  return Math.max(0, 100 - penalty);
}

function computeKeywordScore(matches: KeywordMatch[]): number {
  if (matches.length === 0) return 100;

  const requiredMatches = matches.filter(m => m.category === "required");
  const preferredMatches = matches.filter(m => m.category === "preferred");
  const otherMatches = matches.filter(m => m.category === "keyword");

  let weightedScore = 0;
  let totalWeight = 0;

  for (const m of requiredMatches) {
    const w = 3;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }
  for (const m of preferredMatches) {
    const w = 2;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }
  for (const m of otherMatches) {
    const w = 1;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }

  if (totalWeight === 0) return 100;
  return Math.round((weightedScore / totalWeight) * 100);
}

function computeSectionScores(sections: ParsedSection[], keywordMatches: KeywordMatch[]): SectionScore[] {
  const standardSections = ["contact", "summary", "experience", "education", "skills", "certifications"];

  return standardSections.map(sectionKey => {
    const section = sections.find(s => s.normalizedName === sectionKey);
    const sectionName = Object.keys(SECTION_HEADINGS).find(k => k === sectionKey) || sectionKey;
    const displayName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

    const kwsInSection = keywordMatches.filter(m =>
      m.foundIn.some(f => {
        const matchSection = sections.find(s => s.name === f);
        return matchSection?.normalizedName === sectionKey;
      })
    );
    const kwsMissingFromSection = keywordMatches.filter(m =>
      !m.matched && m.suggestedSection?.toLowerCase().includes(sectionKey)
    );

    const totalRelevant = kwsInSection.length + kwsMissingFromSection.length;
    const coverage = totalRelevant > 0
      ? Math.round((kwsInSection.length / totalRelevant) * 100)
      : (section ? 100 : 0);

    return {
      section: displayName,
      present: !!section,
      keywordsFound: kwsInSection.map(m => m.keyword),
      keywordsMissing: kwsMissingFromSection.map(m => m.keyword),
      coverage,
    };
  });
}

// ── Main Scoring Function ────────────────────────────────────────────────────

export function computeATSMatchBreakdown(
  resumeText: string,
  jdKeywords: JDKeywords,
  options?: {
    fileType?: string;
    semanticMatches?: string[];
  }
): MatchRateBreakdown {
  const sections = parseResumeIntoSections(resumeText);
  const formattingIssues = detectFormattingIssues(resumeText, options?.fileType);
  const keywordMatches = matchKeywordsAgainstResume(jdKeywords, sections, options?.semanticMatches);
  const sectionScores = computeSectionScores(sections, keywordMatches);

  const formattingScore = computeFormattingScore(formattingIssues);
  const keywordScore = computeKeywordScore(keywordMatches);

  const overallScore = Math.round(formattingScore * 0.3 + keywordScore * 0.7);

  const matched = keywordMatches.filter(m => m.matched);
  const missing = keywordMatches.filter(m => !m.matched);
  const requiredKws = keywordMatches.filter(m => m.category === "required");
  const preferredKws = keywordMatches.filter(m => m.category === "preferred");

  return {
    overallScore,
    formattingScore,
    keywordScore,
    formattingIssues,
    keywordMatches,
    sectionScores,
    summary: {
      totalKeywords: keywordMatches.length,
      matchedKeywords: matched.length,
      missingKeywords: missing.length,
      exactMatches: matched.filter(m => m.matchType === "exact").length,
      variantMatches: matched.filter(m => m.matchType === "variant").length,
      semanticMatches: matched.filter(m => m.matchType === "semantic").length,
      requiredHit: requiredKws.filter(m => m.matched).length,
      requiredTotal: requiredKws.length,
      preferredHit: preferredKws.filter(m => m.matched).length,
      preferredTotal: preferredKws.length,
    },
  };
}

// ── Standalone Formatting Score (no JD needed) ───────────────────────────────

export function computeStandaloneFormattingScore(
  resumeText: string,
  fileType?: string
): { score: number; issues: FormattingIssue[] } {
  const issues = detectFormattingIssues(resumeText, fileType);
  return { score: computeFormattingScore(issues), issues };
}

// ── Multi-Dimensional Scoring ───────────────────────────────────────────────

const CATEGORY_WEIGHTS = {
  hard_skills: 0.25,
  soft_skills: 0.10,
  keyword_density: 0.15,
  searchability: 0.20,
  formatting: 0.15,
  recruiter_tips: 0.15,
};

function scoreLabel(score: number): "Excellent" | "Good" | "Needs Work" | "Poor" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function computeSkillCategoryScore(
  matches: KeywordMatch[],
  skillType: "hard" | "soft"
): { score: number; matched: KeywordMatch[]; missing: KeywordMatch[] } {
  const skills = matches.filter(m => m.skillType === skillType);
  if (skills.length === 0) return { score: 100, matched: [], missing: [] };

  const matched = skills.filter(m => m.matched);
  const missing = skills.filter(m => !m.matched);

  let weightedScore = 0;
  let totalWeight = 0;
  for (const m of skills) {
    const w = m.category === "required" ? 3 : m.category === "preferred" ? 2 : 1;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }

  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 100;
  return { score, matched, missing };
}

function buildFormattingChecks(issues: FormattingIssue[]): CategoryCheck[] {
  const checks: CategoryCheck[] = [];
  const categories = ["tables", "images", "columns", "fonts", "headers", "characters", "length", "file_format"] as const;

  for (const cat of categories) {
    const catIssues = issues.filter(i => i.category === cat);
    const hasCritical = catIssues.some(i => i.severity === "critical");
    const hasWarning = catIssues.some(i => i.severity === "warning");
    const hasMinor = catIssues.some(i => i.severity === "minor");

    if (catIssues.length === 0) {
      checks.push({
        name: `No ${cat.replace("_", " ")} issues`,
        passed: true,
        score: 15,
        maxScore: 15,
        detail: `No ${cat.replace("_", " ")} problems detected`,
        fix: null,
      });
    } else {
      const penalty = hasCritical ? 15 : hasWarning ? 8 : 3;
      checks.push({
        name: catIssues[0].issue,
        passed: false,
        score: Math.max(0, 15 - penalty),
        maxScore: 15,
        detail: catIssues[0].issue,
        fix: catIssues[0].fix,
      });
    }
  }

  return checks;
}

export function computeMultiDimensionalScore(
  resumeText: string,
  jdKeywords: JDKeywords,
  options?: {
    fileType?: string;
    semanticMatches?: string[];
    enriched?: EnrichedJDKeywords;
  }
): MultiDimensionalATSResult {
  const sections = parseResumeIntoSections(resumeText);
  const formattingIssues = detectFormattingIssues(resumeText, options?.fileType);
  const keywordMatches = matchKeywordsAgainstResume(
    jdKeywords, sections, options?.semanticMatches, options?.enriched
  );
  const sectionScores = computeSectionScores(sections, keywordMatches);

  const formattingScore = computeFormattingScore(formattingIssues);
  const hardSkillsResult = computeSkillCategoryScore(keywordMatches, "hard");
  const softSkillsResult = computeSkillCategoryScore(keywordMatches, "soft");
  const keywordDensity = analyzeKeywordDensity(keywordMatches, resumeText);
  const searchability = analyzeSearchability(resumeText, sections, options?.enriched?.jobTitle);
  const recruiterTips = analyzeRecruiterTips(resumeText, sections);

  const formattingChecks = buildFormattingChecks(formattingIssues);
  const formattingCheckScore = formattingChecks.length > 0
    ? Math.round(formattingChecks.reduce((s, c) => s + c.score, 0) / formattingChecks.reduce((s, c) => s + c.maxScore, 0) * 100)
    : formattingScore;

  const categoryScores: CategoryScore[] = [
    {
      name: "Hard Skills",
      key: "hard_skills",
      score: hardSkillsResult.score,
      weight: CATEGORY_WEIGHTS.hard_skills,
      checks: ([
        ...hardSkillsResult.matched.slice(0, 5).map((m): CategoryCheck => ({
          name: m.keyword,
          passed: true,
          score: 1,
          maxScore: 1,
          detail: `Found (${m.matchType}) in ${m.foundIn.join(", ") || "resume"}`,
          fix: null,
        })),
        ...hardSkillsResult.missing.slice(0, 5).map((m): CategoryCheck => ({
          name: m.keyword,
          passed: false,
          score: 0,
          maxScore: 1,
          detail: `Missing from resume`,
          fix: `Add "${m.keyword}" to your ${m.suggestedSection || "Skills or Experience"} section`,
        })),
      ]),
    },
    {
      name: "Soft Skills",
      key: "soft_skills",
      score: softSkillsResult.score,
      weight: CATEGORY_WEIGHTS.soft_skills,
      checks: ([
        ...softSkillsResult.matched.slice(0, 3).map((m): CategoryCheck => ({
          name: m.keyword,
          passed: true,
          score: 1,
          maxScore: 1,
          detail: `Found (${m.matchType}) in ${m.foundIn.join(", ") || "resume"}`,
          fix: null,
        })),
        ...softSkillsResult.missing.slice(0, 3).map((m): CategoryCheck => ({
          name: m.keyword,
          passed: false,
          score: 0,
          maxScore: 1,
          detail: `Missing from resume`,
          fix: `Demonstrate "${m.keyword}" through specific examples in Experience section`,
        })),
      ]),
    },
    {
      name: "Keyword Density",
      key: "keyword_density",
      score: keywordDensity.score,
      weight: CATEGORY_WEIGHTS.keyword_density,
      checks: keywordDensity.checks,
    },
    {
      name: "Searchability",
      key: "searchability",
      score: searchability.score,
      weight: CATEGORY_WEIGHTS.searchability,
      checks: searchability.checks,
    },
    {
      name: "Formatting",
      key: "formatting",
      score: formattingCheckScore,
      weight: CATEGORY_WEIGHTS.formatting,
      checks: formattingChecks,
    },
    {
      name: "Recruiter Tips",
      key: "recruiter_tips",
      score: recruiterTips.score,
      weight: CATEGORY_WEIGHTS.recruiter_tips,
      checks: recruiterTips.checks,
    },
  ];

  const overallScore = Math.round(
    categoryScores.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );

  const matched = keywordMatches.filter(m => m.matched);
  const missing = keywordMatches.filter(m => !m.matched);
  const requiredKws = keywordMatches.filter(m => m.category === "required");
  const preferredKws = keywordMatches.filter(m => m.category === "preferred");

  return {
    overallScore,
    scoreLabel: scoreLabel(overallScore),
    categoryScores,
    hardSkillsResult,
    softSkillsResult,
    keywordDensity,
    searchability,
    formatting: { score: formattingScore, issues: formattingIssues },
    recruiterTips,
    keywordMatches,
    sectionScores,
    summary: {
      totalKeywords: keywordMatches.length,
      matchedKeywords: matched.length,
      missingKeywords: missing.length,
      exactMatches: matched.filter(m => m.matchType === "exact").length,
      variantMatches: matched.filter(m => m.matchType === "variant").length,
      semanticMatches: matched.filter(m => m.matchType === "semantic").length,
      requiredHit: requiredKws.filter(m => m.matched).length,
      requiredTotal: requiredKws.length,
      preferredHit: preferredKws.filter(m => m.matched).length,
      preferredTotal: preferredKws.length,
    },
  };
}

// ── Live (client-side, JD-independent) Resume Health ────────────────────────
// Fast, LLM-free score for "live as you type" editing. Blends the three
// deterministic analyzers that need no job description: formatting,
// searchability, and recruiter tips. Safe to run on every keystroke (debounced).

export interface LiveResumeHealth {
  score: number;
  label: "Excellent" | "Good" | "Needs Work" | "Poor";
  breakdown: { formatting: number; searchability: number; recruiterTips: number };
  stats: {
    actionVerbRate: number;
    measurableResultRate: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    estimatedPages: number;
    contactFieldsFound: number;
    contactFieldsTotal: number;
    standardSectionsFound: number;
    standardSectionsTotal: number;
    wordCount: number;
  };
  topFixes: string[];
}

// JD-independent subset of CATEGORY_WEIGHTS, renormalized to sum to 1.
const LIVE_WEIGHTS = {
  searchability: 0.4,
  formatting: 0.3,
  recruiterTips: 0.3,
};

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, minor: 2 };

export function computeLiveResumeHealth(resumeText: string): LiveResumeHealth {
  const text = resumeText || "";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Empty / near-empty resume: return a neutral zero state rather than misleading 100s.
  if (wordCount < 15) {
    return {
      score: 0,
      label: "Poor",
      breakdown: { formatting: 0, searchability: 0, recruiterTips: 0 },
      stats: {
        actionVerbRate: 0,
        measurableResultRate: 0,
        bulletsWithMetrics: 0,
        totalBullets: 0,
        estimatedPages: 0,
        contactFieldsFound: 0,
        contactFieldsTotal: 5,
        standardSectionsFound: 0,
        standardSectionsTotal: REQUIRED_HEADINGS.length,
        wordCount,
      },
      topFixes: ["Start writing your resume to see live ATS feedback."],
    };
  }

  const sections = parseResumeIntoSections(text);
  const formatting = computeStandaloneFormattingScore(text);
  const searchability = analyzeSearchability(text, sections);
  const recruiterTips = analyzeRecruiterTips(text, sections);

  const score = Math.round(
    formatting.score * LIVE_WEIGHTS.formatting +
      searchability.score * LIVE_WEIGHTS.searchability +
      recruiterTips.score * LIVE_WEIGHTS.recruiterTips
  );

  const label: LiveResumeHealth["label"] =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor";

  // Collect the highest-impact fixes: formatting issues (by severity) first,
  // then failed searchability/recruiter checks. Dedup, cap at 3.
  const fixes: string[] = [];
  const seen = new Set<string>();
  const push = (fix: string | null | undefined) => {
    if (!fix) return;
    const key = fix.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    fixes.push(fix.trim());
  };

  [...formatting.issues]
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3))
    .forEach(i => push(i.fix));
  searchability.checks.filter(c => !c.passed).forEach(c => push(c.fix));
  recruiterTips.checks.filter(c => !c.passed).forEach(c => push(c.fix));

  const contactFieldsFound = Object.values(searchability.contactFields).filter(Boolean).length;

  return {
    score,
    label,
    breakdown: {
      formatting: formatting.score,
      searchability: searchability.score,
      recruiterTips: recruiterTips.score,
    },
    stats: {
      actionVerbRate: recruiterTips.actionVerbRate,
      measurableResultRate: recruiterTips.measurableResultRate,
      bulletsWithMetrics: recruiterTips.bulletsWithMetrics,
      totalBullets: recruiterTips.totalBullets,
      estimatedPages: recruiterTips.estimatedPages,
      contactFieldsFound,
      contactFieldsTotal: 5,
      standardSectionsFound: searchability.standardHeadings.filter(h => h.present).length,
      standardSectionsTotal: REQUIRED_HEADINGS.length,
      wordCount,
    },
    topFixes: fixes.slice(0, 3),
  };
}
