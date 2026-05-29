import { NextRequest, NextResponse } from "next/server";

export interface JobListing {
  id: string | number;
  title: string;
  company_name: string;
  url: string;
  salary?: string;
  job_type?: string;
  tags?: string[];
  candidate_required_location?: string;
  publication_date?: string;
}

// Cache results for 1 hour to avoid hammering the free API
const cache = new Map<string, { data: JobListing[]; at: number }>();
const CACHE_TTL = 60 * 60 * 1000;

function buildSearchQuery(role: string): string {
  // Extract key terms from the role title for better search results
  return role
    .replace(/\b(senior|junior|lead|principal|staff|mid|associate)\b/gi, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "";
  if (!role) {
    return NextResponse.json({ jobs: [], source: "none" }, { status: 400 });
  }

  const query = buildSearchQuery(role);
  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({ jobs: cached.data, source: "remotive" });
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodedQuery}&limit=8`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error(`Remotive returned ${res.status}`);

    const data = (await res.json()) as { jobs: JobListing[] };
    const jobs: JobListing[] = (data.jobs ?? []).slice(0, 8).map((j) => ({
      id: j.id,
      title: j.title,
      company_name: j.company_name,
      url: j.url,
      salary: j.salary,
      job_type: j.job_type,
      tags: (j.tags ?? []).slice(0, 4),
      candidate_required_location: j.candidate_required_location,
      publication_date: j.publication_date,
    }));

    cache.set(cacheKey, { data: jobs, at: Date.now() });
    return NextResponse.json({ jobs, source: "remotive" });
  } catch {
    return NextResponse.json({ jobs: [], source: "none" });
  }
}
