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
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  is_remote?: boolean;
}

export interface MatchProfile {
  skills: string[];
  targetRole?: string;
  preferredLocations?: string[];
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  yearsExperience?: number;
}

export interface DetailedMatchResult {
  score: number;
  matched: string[];
  breakdown: {
    skills: number;
    role: number;
    location: number;
    salary: number;
    experience: number;
  };
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

function inferExperienceLevel(title: string): string | null {
  const lower = title.toLowerCase();
  if (/\b(intern|internship)\b/.test(lower)) return "intern";
  if (/\b(junior|jr\.?|entry[- ]level|associate)\b/.test(lower)) return "junior";
  if (/\b(mid[- ]?level|mid)\b/.test(lower)) return "mid";
  if (/\b(senior|sr\.?|lead|principal|staff)\b/.test(lower)) return "senior";
  if (/\b(director|vp|vice president|head of|chief)\b/.test(lower)) return "executive";
  return null;
}

function experienceLevelScore(
  jobLevel: string | null,
  yearsExperience: number | undefined
): number {
  if (!jobLevel || yearsExperience === undefined) return 0;
  const levelRanges: Record<string, [number, number]> = {
    intern: [0, 1],
    junior: [0, 3],
    mid: [3, 7],
    senior: [5, 15],
    executive: [10, 30],
  };
  const [min, max] = levelRanges[jobLevel] ?? [0, 30];
  if (yearsExperience >= min && yearsExperience <= max) return 10;
  const gap = yearsExperience < min ? min - yearsExperience : yearsExperience - max;
  return Math.max(0, 10 - gap * 3);
}

function locationScore(
  jobLocation: string | undefined,
  jobIsRemote: boolean | undefined,
  preferredLocations: string[] | undefined,
  remoteOnly: boolean | undefined
): number {
  if (!preferredLocations?.length && !remoteOnly) return 0;
  const locLower = (jobLocation ?? "").toLowerCase();
  const isRemote =
    jobIsRemote ||
    /\b(remote|anywhere|worldwide|distributed)\b/.test(locLower);

  if (remoteOnly) {
    return isRemote ? 10 : 0;
  }

  if (isRemote) return 8;

  if (preferredLocations?.length) {
    for (const pref of preferredLocations) {
      if (locLower.includes(pref.toLowerCase())) return 10;
    }
    return 2;
  }

  return 0;
}

function parseSalaryRange(salary: string | undefined): { min: number; max: number } | null {
  if (!salary) return null;
  const numbers = salary.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return null;
  const parsed = numbers.map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => !isNaN(n));
  if (parsed.length === 0) return null;

  const isK = /\bk\b/i.test(salary);
  const multiplier = isK ? 1000 : 1;
  const vals = parsed.map((v) => v * multiplier);

  if (/\/hr|per hour|hourly/i.test(salary)) {
    return { min: vals[0] * 2080, max: (vals[1] ?? vals[0]) * 2080 };
  }
  return { min: vals[0], max: vals[1] ?? vals[0] };
}

function salaryScore(
  jobSalary: string | undefined,
  jobSalaryMin: number | undefined,
  jobSalaryMax: number | undefined,
  userSalaryMin: number | undefined
): number {
  if (!userSalaryMin) return 0;
  let jMin = jobSalaryMin;
  let jMax = jobSalaryMax;
  if (jMin === undefined && jobSalary) {
    const parsed = parseSalaryRange(jobSalary);
    if (parsed) {
      jMin = parsed.min;
      jMax = parsed.max;
    }
  }
  if (jMin === undefined) return 0;
  const effectiveMax = jMax ?? jMin;
  if (effectiveMax >= userSalaryMin) return 10;
  const gap = ((userSalaryMin - effectiveMax) / userSalaryMin) * 100;
  if (gap <= 10) return 7;
  if (gap <= 20) return 4;
  return 0;
}

export function computeDetailedMatchScore(
  job: EnrichedJob,
  profile: MatchProfile
): DetailedMatchResult {
  const { score: baseSkillScore, matched } = computeMatchScore(
    job,
    profile.skills,
    profile.targetRole
  );

  const skillsPart = Math.round(baseSkillScore * 0.5 / 99 * 50);

  let rolePart = 0;
  if (profile.targetRole) {
    const roleTokens = tokenize(profile.targetRole);
    const titleTokens = tokenize(job.title);
    let overlap = 0;
    for (const t of roleTokens) {
      if (titleTokens.has(t)) overlap++;
    }
    rolePart = roleTokens.size > 0 ? Math.round((overlap / roleTokens.size) * 20) : 0;
  }

  const locPart = locationScore(
    job.location,
    job.is_remote,
    profile.preferredLocations,
    profile.remoteOnly
  );

  const salPart = salaryScore(
    job.salary,
    job.salary_min,
    job.salary_max,
    profile.salaryMin
  );

  const jobLevel = inferExperienceLevel(job.title) ?? job.experience_level ?? null;
  const expPart = experienceLevelScore(jobLevel, profile.yearsExperience);

  const total = Math.min(99, skillsPart + rolePart + locPart + salPart + expPart);

  return {
    score: total,
    matched,
    breakdown: {
      skills: skillsPart,
      role: rolePart,
      location: locPart,
      salary: salPart,
      experience: expPart,
    },
  };
}
