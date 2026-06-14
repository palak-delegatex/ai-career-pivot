import { NextRequest, NextResponse } from "next/server";
import { computeMatchScore, sortByMatch } from "@/lib/job-match";
import type { EnrichedJob } from "@/lib/job-match";

const cache = new Map<string, { data: EnrichedJob[]; at: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours — fresher than 24h for live feel

function buildSearchQuery(role: string): string {
  return role
    .replace(/\b(senior|junior|lead|principal|staff|mid|associate)\b/gi, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_apply_link: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_employment_type: string | null;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string | null;
  job_description: string | null;
  job_required_skills: string[] | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
  };
}

function formatSalary(job: JSearchJob): string | undefined {
  if (!job.job_min_salary && !job.job_max_salary) return undefined;
  const currency = job.job_salary_currency ?? "USD";
  const period = job.job_salary_period === "YEAR" ? "/yr" : job.job_salary_period === "HOUR" ? "/hr" : "";
  if (job.job_min_salary && job.job_max_salary) {
    return `${currency} ${Math.round(job.job_min_salary / 1000)}k–${Math.round(job.job_max_salary / 1000)}k${period}`;
  }
  const val = job.job_min_salary ?? job.job_max_salary;
  return val ? `${currency} ${Math.round(val / 1000)}k${period}` : undefined;
}

function extractSkillTags(job: JSearchJob): string[] {
  const tags = new Set<string>();
  for (const s of job.job_required_skills ?? []) {
    if (s.length < 30) tags.add(s);
  }
  for (const q of job.job_highlights?.Qualifications ?? []) {
    const words = q.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
    if (words) {
      for (const w of words.slice(0, 2)) {
        if (w.length < 25 && w.length > 2) tags.add(w);
      }
    }
  }
  return [...tags].slice(0, 5);
}

function snippetFromDescription(desc: string | null): string | undefined {
  if (!desc) return undefined;
  const clean = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > 200 ? clean.slice(0, 197) + "..." : clean;
}

async function fetchJSearch(query: string, location: string): Promise<EnrichedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: location ? `${query} in ${location}` : query,
    page: "1",
    num_pages: "1",
    date_posted: "week",
  });

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
    {
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { data: JSearchJob[] };
  return (data.data ?? []).slice(0, 12).map((j) => ({
    id: j.job_id,
    title: j.job_title,
    company_name: j.employer_name,
    url: j.job_apply_link,
    salary: formatSalary(j),
    job_type: j.job_is_remote
      ? "Remote"
      : j.job_employment_type?.replace(/_/g, " ").toLowerCase() ?? undefined,
    tags: extractSkillTags(j),
    location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || undefined,
    publication_date: j.job_posted_at_datetime_utc ?? undefined,
    description_snippet: snippetFromDescription(j.job_description),
    source: "jsearch" as const,
    matchScore: 0,
    matchedSkills: [],
  }));
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  url: string;
  salary?: string;
  job_type?: string;
  tags?: string[];
  candidate_required_location?: string;
  publication_date?: string;
  description?: string;
}

async function fetchRemotive(query: string, location: string): Promise<EnrichedJob[]> {
  const encodedQuery = encodeURIComponent(query);
  const locationParam = location ? `&location=${encodeURIComponent(location)}` : "";
  const res = await fetch(
    `https://remotive.com/api/remote-jobs?search=${encodedQuery}&limit=12${locationParam}`,
    { next: { revalidate: 14400 } }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { jobs: RemotiveJob[] };
  return (data.jobs ?? []).slice(0, 12).map((j) => ({
    id: j.id,
    title: j.title,
    company_name: j.company_name,
    url: j.url,
    salary: j.salary || undefined,
    job_type: j.job_type || "Remote",
    tags: (j.tags ?? []).slice(0, 5),
    location: j.candidate_required_location || undefined,
    publication_date: j.publication_date ?? undefined,
    description_snippet: j.description
      ? j.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
      : undefined,
    source: "remotive" as const,
    matchScore: 0,
    matchedSkills: [],
  }));
}

async function fetchAdzunaJobs(query: string, location?: string): Promise<EnrichedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    results_per_page: "12",
    "content-type": "application/json",
  });
  if (location) params.set("where", location);

  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).map((j: Record<string, unknown>) => {
    const company = j.company as Record<string, string> | undefined;
    const loc = j.location as Record<string, string> | undefined;
    const salaryMin = j.salary_min as number | undefined;
    const salaryMax = j.salary_max as number | undefined;
    const salary =
      salaryMin && salaryMax
        ? `$${Math.round(salaryMin / 1000)}k–$${Math.round(salaryMax / 1000)}k/yr`
        : salaryMin
          ? `From $${Math.round(salaryMin / 1000)}k/yr`
          : undefined;
    const cat = j.category as Record<string, string> | undefined;

    return {
      id: `adzuna_${j.id}`,
      title: j.title as string,
      company_name: company?.display_name ?? "Unknown",
      url: j.redirect_url as string,
      salary,
      job_type: (j.contract_type as string) || "Full-time",
      tags: cat?.tag ? [cat.tag] : [],
      location: loc?.display_name ?? "",
      publication_date: j.created as string,
      description_snippet: ((j.description as string) || "").slice(0, 200),
      source: "adzuna" as const,
      matchScore: 0,
      matchedSkills: [],
    };
  });
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "";
  const location = req.nextUrl.searchParams.get("location") ?? "";
  const skillsParam = req.nextUrl.searchParams.get("skills") ?? "";
  if (!role) {
    return NextResponse.json({ jobs: [], source: "none", total: 0 }, { status: 400 });
  }

  const query = buildSearchQuery(role);
  const userSkills = skillsParam
    ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const cacheKey = `${query.toLowerCase()}::${location.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  let rawJobs: EnrichedJob[];
  let source: string;

  if (cached && Date.now() - cached.at < CACHE_TTL) {
    rawJobs = cached.data;
    source = rawJobs[0]?.source ?? "cache";
  } else {
    // Fetch JSearch and Adzuna in parallel, fall back to Remotive if both empty
    const [jsearchResult, adzunaResult] = await Promise.allSettled([
      fetchJSearch(query, location),
      fetchAdzunaJobs(query, location),
    ]);

    const jsearchJobs = jsearchResult.status === "fulfilled" ? jsearchResult.value : [];
    const adzunaJobs = adzunaResult.status === "fulfilled" ? adzunaResult.value : [];

    // Merge and deduplicate by title+company (case-insensitive)
    const seen = new Set<string>();
    const allJobs: EnrichedJob[] = [];
    for (const job of [...jsearchJobs, ...adzunaJobs]) {
      const key = `${job.title.toLowerCase()}::${job.company_name.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        allJobs.push(job);
      }
    }

    if (allJobs.length > 0) {
      rawJobs = allJobs;
      source = jsearchJobs.length > 0 && adzunaJobs.length > 0
        ? "jsearch+adzuna"
        : jsearchJobs.length > 0
          ? "jsearch"
          : "adzuna";
    } else {
      // Both empty — fall back to Remotive
      rawJobs = await fetchRemotive(query, location);
      source = "remotive";
    }

    if (rawJobs.length > 0) {
      cache.set(cacheKey, { data: rawJobs, at: Date.now() });
    }
  }

  // Compute match scores
  const scored = rawJobs.map((job) => {
    const { score, matched } = computeMatchScore(job, userSkills, role);
    return { ...job, matchScore: score, matchedSkills: matched };
  });

  const sorted = sortByMatch(scored).slice(0, 10);

  // Surface salary data when available (Adzuna often provides this)
  const salaryData = sorted.filter((j) => j.salary).slice(0, 5);

  return NextResponse.json({
    jobs: sorted,
    source,
    total: sorted.length,
    hasMatchScores: userSkills.length > 0,
    salaryRange: salaryData.length > 0
      ? salaryData.map((j) => ({ title: j.title, salary: j.salary }))
      : undefined,
  });
}
