export interface EnrichedJob {
  id: string | number;
  title: string;
  company_name: string;
  url: string;
  salary?: string;
  job_type?: string;
  tags?: string[];
  location?: string;
  publication_date?: string;
  description_snippet?: string;
  source: "jsearch" | "remotive" | "adzuna";
  matchScore: number;
  matchedSkills: string[];
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function normalizeSkill(skill: string): string[] {
  const lower = skill.toLowerCase().trim();
  const variants = [lower];
  // "Project Management" -> also match "project" and "management"
  if (lower.includes(" ")) {
    variants.push(...lower.split(/\s+/).filter((w) => w.length > 2));
  }
  // Common abbreviations
  const abbrevs: Record<string, string[]> = {
    javascript: ["js", "javascript"],
    typescript: ["ts", "typescript"],
    "machine learning": ["ml", "machine learning"],
    "artificial intelligence": ["ai", "artificial intelligence"],
    "project management": ["pm", "project management", "pmp"],
    "data analysis": ["data analysis", "analytics", "data analyst"],
    "user experience": ["ux", "user experience"],
    "user interface": ["ui", "user interface"],
    python: ["python", "py"],
    "react.js": ["react", "reactjs"],
    "node.js": ["node", "nodejs"],
    sql: ["sql", "mysql", "postgresql", "postgres"],
  };
  for (const [key, alts] of Object.entries(abbrevs)) {
    if (lower.includes(key) || alts.some((a) => lower.includes(a))) {
      variants.push(...alts);
    }
  }
  return [...new Set(variants)];
}

export function computeMatchScore(
  job: { title: string; tags?: string[]; description_snippet?: string },
  userSkills: string[],
  targetRole?: string
): { score: number; matched: string[] } {
  if (!userSkills.length) return { score: 0, matched: [] };

  const jobText = [
    job.title,
    ...(job.tags ?? []),
    job.description_snippet ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const jobTokens = tokenize(jobText);
  const matched: string[] = [];

  for (const skill of userSkills) {
    const variants = normalizeSkill(skill);
    const hit = variants.some(
      (v) =>
        jobText.includes(v) ||
        (v.length > 2 && jobTokens.has(v))
    );
    if (hit) matched.push(skill);
  }

  let score = Math.round((matched.length / Math.min(userSkills.length, 12)) * 80);

  // Boost if job title closely matches target role
  if (targetRole) {
    const roleTokens = tokenize(targetRole);
    const titleTokens = tokenize(job.title);
    let roleOverlap = 0;
    for (const t of roleTokens) {
      if (titleTokens.has(t)) roleOverlap++;
    }
    if (roleTokens.size > 0) {
      score += Math.round((roleOverlap / roleTokens.size) * 20);
    }
  }

  return { score: Math.min(score, 99), matched };
}

export function sortByMatch(jobs: EnrichedJob[]): EnrichedJob[] {
  return [...jobs].sort((a, b) => b.matchScore - a.matchScore);
}
