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
  semanticMatches?: string[]
): KeywordMatch[] {
  const results: KeywordMatch[] = [];
  const semanticSet = new Set((semanticMatches || []).map(s => normalizeForMatch(s)));

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
    });
  }

  for (const kw of jdKeywords.required) processKeyword(kw, "required");
  for (const kw of jdKeywords.preferred) processKeyword(kw, "preferred");
  for (const kw of jdKeywords.keywords) processKeyword(kw, "keyword");

  return results;
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
