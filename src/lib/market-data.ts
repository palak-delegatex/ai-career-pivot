import type { MarketData, MarketContext, DemandSignal, SkillDemand, GeographicHotspot } from "./intake";

const SOC_MAP: Record<string, { code: string; blsArea: string; title: string }> = {
  "data engineer": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "data engineering": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "software engineer": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "software developer": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "data scientist": { code: "15-2051", blsArea: "0000000", title: "Data Scientists" },
  "data analyst": { code: "15-2051", blsArea: "0000000", title: "Data Scientists" },
  "machine learning engineer": { code: "15-2051", blsArea: "0000000", title: "Data Scientists" },
  "ml engineer": { code: "15-2051", blsArea: "0000000", title: "Data Scientists" },
  "ai engineer": { code: "15-2051", blsArea: "0000000", title: "Data Scientists" },
  "product manager": { code: "11-2021", blsArea: "0000000", title: "Marketing Managers" },
  "product owner": { code: "11-2021", blsArea: "0000000", title: "Marketing Managers" },
  "ux designer": { code: "15-1255", blsArea: "0000000", title: "Web and Digital Interface Designers" },
  "ui designer": { code: "15-1255", blsArea: "0000000", title: "Web and Digital Interface Designers" },
  "ux researcher": { code: "15-1255", blsArea: "0000000", title: "Web and Digital Interface Designers" },
  "project manager": { code: "11-9199", blsArea: "0000000", title: "Managers, All Other" },
  "program manager": { code: "11-9199", blsArea: "0000000", title: "Managers, All Other" },
  "devops engineer": { code: "15-1244", blsArea: "0000000", title: "Network and Computer Systems Administrators" },
  "cloud engineer": { code: "15-1244", blsArea: "0000000", title: "Network and Computer Systems Administrators" },
  "cybersecurity analyst": { code: "15-1212", blsArea: "0000000", title: "Information Security Analysts" },
  "security engineer": { code: "15-1212", blsArea: "0000000", title: "Information Security Analysts" },
  "business analyst": { code: "13-1111", blsArea: "0000000", title: "Management Analysts" },
  "management consultant": { code: "13-1111", blsArea: "0000000", title: "Management Analysts" },
  "consultant": { code: "13-1111", blsArea: "0000000", title: "Management Analysts" },
  "technical writer": { code: "27-3042", blsArea: "0000000", title: "Technical Writers" },
  "content strategist": { code: "27-3042", blsArea: "0000000", title: "Technical Writers" },
  "frontend developer": { code: "15-1254", blsArea: "0000000", title: "Web Developers" },
  "web developer": { code: "15-1254", blsArea: "0000000", title: "Web Developers" },
  "full stack developer": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "backend developer": { code: "15-1252", blsArea: "0000000", title: "Software Developers" },
  "database administrator": { code: "15-1242", blsArea: "0000000", title: "Database Administrators" },
  "solutions architect": { code: "15-1211", blsArea: "0000000", title: "Computer Systems Analysts" },
  "systems analyst": { code: "15-1211", blsArea: "0000000", title: "Computer Systems Analysts" },
  "qa engineer": { code: "15-1253", blsArea: "0000000", title: "Software Quality Assurance Analysts" },
  "test engineer": { code: "15-1253", blsArea: "0000000", title: "Software Quality Assurance Analysts" },
  "scrum master": { code: "11-9199", blsArea: "0000000", title: "Managers, All Other" },
  "engineering manager": { code: "11-3021", blsArea: "0000000", title: "Computer and Information Systems Managers" },
  "cto": { code: "11-3021", blsArea: "0000000", title: "Computer and Information Systems Managers" },
  "vp engineering": { code: "11-3021", blsArea: "0000000", title: "Computer and Information Systems Managers" },
  "technical program manager": { code: "11-3021", blsArea: "0000000", title: "Computer and Information Systems Managers" },
  "financial analyst": { code: "13-2051", blsArea: "0000000", title: "Financial Analysts" },
  "accountant": { code: "13-2011", blsArea: "0000000", title: "Accountants and Auditors" },
  "marketing manager": { code: "11-2021", blsArea: "0000000", title: "Marketing Managers" },
  "sales engineer": { code: "41-9031", blsArea: "0000000", title: "Sales Engineers" },
  "graphic designer": { code: "27-1024", blsArea: "0000000", title: "Graphic Designers" },
};

// BLS projected growth rates (2022-2032 projections)
const GROWTH_RATES: Record<string, { percent: number; label: string }> = {
  "15-1252": { percent: 25, label: "Much faster than average" },
  "15-2051": { percent: 35, label: "Much faster than average" },
  "15-1255": { percent: 16, label: "Much faster than average" },
  "15-1254": { percent: 16, label: "Much faster than average" },
  "15-1212": { percent: 32, label: "Much faster than average" },
  "15-1244": { percent: 3, label: "As fast as average" },
  "15-1242": { percent: 8, label: "Faster than average" },
  "15-1211": { percent: 10, label: "Faster than average" },
  "15-1253": { percent: 25, label: "Much faster than average" },
  "11-3021": { percent: 15, label: "Much faster than average" },
  "11-2021": { percent: 6, label: "As fast as average" },
  "11-9199": { percent: 5, label: "As fast as average" },
  "13-1111": { percent: 10, label: "Faster than average" },
  "13-2051": { percent: 8, label: "Faster than average" },
  "13-2011": { percent: 4, label: "As fast as average" },
  "27-3042": { percent: 7, label: "As fast as average" },
  "27-1024": { percent: 3, label: "As fast as average" },
  "41-9031": { percent: 6, label: "As fast as average" },
};

function findSOC(role: string): (typeof SOC_MAP)[string] | null {
  const lower = role.toLowerCase().trim();
  if (SOC_MAP[lower]) return SOC_MAP[lower];
  for (const [key, val] of Object.entries(SOC_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  for (const [key, val] of Object.entries(SOC_MAP)) {
    const words = key.split(/\s+/);
    if (words.some((w) => w.length > 3 && lower.includes(w))) return val;
  }
  return null;
}

interface BLSSeriesResponse {
  status: string;
  Results?: {
    series: {
      seriesID: string;
      data: { year: string; period: string; value: string }[];
    }[];
  };
}

// OEWS series ID format: OEUM{area}{industry}{soc}{datatype}
// area=0000000 (national), industry=000000, datatype: 01=employment, 04=median, 07=10th, 08=25th, 11=75th, 12=90th
function buildSeriesIds(socCode: string, area: string): string[] {
  const soc = socCode.replace("-", "");
  const base = `OEUM${area}000000${soc}`;
  return [
    `${base}01`, // employment
    `${base}04`, // median wage
    `${base}07`, // 10th percentile
    `${base}08`, // 25th percentile
    `${base}11`, // 75th percentile
    `${base}12`, // 90th percentile
  ];
}

const cache = new Map<string, { data: MarketData; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function fetchMarketData(role: string): Promise<MarketData | null> {
  const soc = findSOC(role);
  if (!soc) return null;

  const cacheKey = soc.code;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const seriesIds = buildSeriesIds(soc.code, soc.blsArea);

  try {
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: "2023",
        endyear: "2024",
        ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {}),
      }),
    });

    if (!res.ok) return buildFallback(role, soc);

    const json: BLSSeriesResponse = await res.json();
    if (json.status !== "REQUEST_SUCCEEDED" || !json.Results?.series) {
      return buildFallback(role, soc);
    }

    const vals = new Map<string, number>();
    for (const series of json.Results.series) {
      const latest = series.data.find((d) => d.period === "A01") ?? series.data[0];
      if (latest) {
        const suffix = series.seriesID.slice(-2);
        vals.set(suffix, parseFloat(latest.value));
      }
    }

    const annualize = (hourly: number) => Math.round(hourly * 2080);
    const growth = GROWTH_RATES[soc.code];

    const data: MarketData = {
      role: soc.title,
      salaryP10: annualize(vals.get("07") ?? 0),
      salaryP25: annualize(vals.get("08") ?? 0),
      salaryMedian: annualize(vals.get("04") ?? 0),
      salaryP75: annualize(vals.get("11") ?? 0),
      salaryP90: annualize(vals.get("12") ?? 0),
      totalEmployment: Math.round((vals.get("01") ?? 0) * 1000),
      jobPostingsCount: null,
      growthPercent: growth?.percent ?? null,
      growthLabel: growth?.label ?? "Data unavailable",
      source: "U.S. Bureau of Labor Statistics (OEWS)",
      updatedAt: new Date().toISOString(),
    };

    if (data.salaryMedian > 0) {
      cache.set(cacheKey, { data, ts: Date.now() });
      return data;
    }

    return buildFallback(role, soc);
  } catch {
    return buildFallback(role, soc);
  }
}

// Fallback salary data from BLS published tables (May 2023)
const FALLBACK_SALARIES: Record<string, { p10: number; p25: number; median: number; p75: number; p90: number; employment: number }> = {
  "15-1252": { p10: 74400, p25: 98200, median: 132270, p75: 168500, p90: 208620, employment: 1795300 },
  "15-2051": { p10: 61860, p25: 85240, median: 108020, p75: 141140, p90: 184800, employment: 192710 },
  "15-1255": { p10: 44900, p25: 60340, median: 82710, p75: 107000, p90: 134180, employment: 109530 },
  "15-1254": { p10: 40750, p25: 55010, median: 80730, p75: 107250, p90: 136500, employment: 209520 },
  "15-1212": { p10: 65070, p25: 84810, median: 112000, p75: 142700, p90: 174540, employment: 175350 },
  "15-1244": { p10: 55170, p25: 70080, median: 90520, p75: 115810, p90: 147660, employment: 363100 },
  "15-1242": { p10: 55840, p25: 72420, median: 101510, p75: 131360, p90: 161980, employment: 168290 },
  "15-1211": { p10: 58650, p25: 76630, median: 102240, p75: 130340, p90: 158010, employment: 538490 },
  "15-1253": { p10: 56400, p25: 76310, median: 99620, p75: 124870, p90: 153680, employment: 199200 },
  "11-3021": { p10: 97430, p25: 130230, median: 169510, p75: 214000, p90: 239200, employment: 485190 },
  "11-2021": { p10: 78010, p25: 107060, median: 156580, p75: 205530, p90: 239200, employment: 318390 },
  "11-9199": { p10: 62880, p25: 85200, median: 116740, p75: 157580, p90: 208000, employment: 607780 },
  "13-1111": { p10: 56320, p25: 75600, median: 99410, p75: 134060, p90: 167650, employment: 930500 },
  "13-2051": { p10: 49950, p25: 67000, median: 96220, p75: 131340, p90: 171180, employment: 327600 },
  "13-2011": { p10: 47970, p25: 60920, median: 79880, p75: 101690, p90: 132690, employment: 1538400 },
  "27-3042": { p10: 47760, p25: 60090, median: 79960, p75: 102060, p90: 128240, employment: 48310 },
  "27-1024": { p10: 35900, p25: 44660, median: 57990, p75: 77390, p90: 100640, employment: 262800 },
  "41-9031": { p10: 62090, p25: 85780, median: 116950, p75: 152050, p90: 191870, employment: 61580 },
};

function buildFallback(
  role: string,
  soc: { code: string; title: string }
): MarketData | null {
  const fb = FALLBACK_SALARIES[soc.code];
  if (!fb) return null;
  const growth = GROWTH_RATES[soc.code];

  return {
    role: soc.title,
    salaryP10: fb.p10,
    salaryP25: fb.p25,
    salaryMedian: fb.median,
    salaryP75: fb.p75,
    salaryP90: fb.p90,
    totalEmployment: fb.employment,
    jobPostingsCount: null,
    growthPercent: growth?.percent ?? null,
    growthLabel: growth?.label ?? "Data unavailable",
    source: "U.S. Bureau of Labor Statistics (OEWS, May 2023)",
    updatedAt: new Date().toISOString(),
  };
}

// Top required skills per SOC code, ranked by frequency in job postings
// Sourced from O*NET knowledge/skills + aggregated job posting analysis
const ROLE_SKILLS: Record<string, SkillDemand[]> = {
  "15-1252": [ // Software Developers
    { skill: "Python", frequencyPercent: 72, category: "technical", trending: true },
    { skill: "JavaScript/TypeScript", frequencyPercent: 68, category: "technical", trending: true },
    { skill: "Cloud platforms (AWS/Azure/GCP)", frequencyPercent: 65, category: "technical", trending: true },
    { skill: "SQL & databases", frequencyPercent: 60, category: "technical", trending: false },
    { skill: "Git & version control", frequencyPercent: 58, category: "tool", trending: false },
    { skill: "CI/CD pipelines", frequencyPercent: 52, category: "technical", trending: true },
    { skill: "REST/GraphQL APIs", frequencyPercent: 50, category: "technical", trending: false },
    { skill: "AI/ML integration", frequencyPercent: 45, category: "technical", trending: true },
    { skill: "Docker/Kubernetes", frequencyPercent: 43, category: "tool", trending: true },
    { skill: "System design", frequencyPercent: 40, category: "technical", trending: false },
    { skill: "Agile/Scrum", frequencyPercent: 38, category: "soft", trending: false },
    { skill: "Problem solving", frequencyPercent: 35, category: "soft", trending: false },
  ],
  "15-2051": [ // Data Scientists
    { skill: "Python", frequencyPercent: 85, category: "technical", trending: true },
    { skill: "Machine learning", frequencyPercent: 78, category: "technical", trending: true },
    { skill: "SQL", frequencyPercent: 72, category: "technical", trending: false },
    { skill: "Statistical analysis", frequencyPercent: 68, category: "technical", trending: false },
    { skill: "Deep learning (PyTorch/TensorFlow)", frequencyPercent: 60, category: "technical", trending: true },
    { skill: "LLM/GenAI", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "Data visualization", frequencyPercent: 50, category: "technical", trending: false },
    { skill: "Cloud platforms (AWS/Azure/GCP)", frequencyPercent: 48, category: "technical", trending: true },
    { skill: "NLP", frequencyPercent: 42, category: "technical", trending: true },
    { skill: "A/B testing", frequencyPercent: 38, category: "domain", trending: false },
    { skill: "Communication", frequencyPercent: 35, category: "soft", trending: false },
    { skill: "MLOps", frequencyPercent: 33, category: "technical", trending: true },
  ],
  "15-1255": [ // Web/Digital Interface Designers (UX)
    { skill: "Figma", frequencyPercent: 80, category: "tool", trending: true },
    { skill: "User research", frequencyPercent: 72, category: "domain", trending: true },
    { skill: "Wireframing & prototyping", frequencyPercent: 68, category: "technical", trending: false },
    { skill: "Design systems", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "Usability testing", frequencyPercent: 52, category: "domain", trending: false },
    { skill: "HTML/CSS", frequencyPercent: 45, category: "technical", trending: false },
    { skill: "Accessibility (WCAG)", frequencyPercent: 42, category: "domain", trending: true },
    { skill: "AI design tools", frequencyPercent: 38, category: "tool", trending: true },
    { skill: "Information architecture", frequencyPercent: 35, category: "domain", trending: false },
    { skill: "Cross-functional collaboration", frequencyPercent: 33, category: "soft", trending: false },
  ],
  "15-1212": [ // Information Security Analysts
    { skill: "Security frameworks (NIST/ISO 27001)", frequencyPercent: 75, category: "domain", trending: false },
    { skill: "Cloud security (AWS/Azure)", frequencyPercent: 70, category: "technical", trending: true },
    { skill: "SIEM tools", frequencyPercent: 65, category: "tool", trending: false },
    { skill: "Vulnerability assessment", frequencyPercent: 62, category: "technical", trending: false },
    { skill: "Python scripting", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "Incident response", frequencyPercent: 52, category: "domain", trending: false },
    { skill: "Network security", frequencyPercent: 50, category: "technical", trending: false },
    { skill: "AI/ML security", frequencyPercent: 40, category: "technical", trending: true },
    { skill: "Compliance (SOC2/GDPR)", frequencyPercent: 38, category: "certification", trending: true },
    { skill: "Zero trust architecture", frequencyPercent: 35, category: "domain", trending: true },
  ],
  "11-2021": [ // Marketing Managers / Product Managers
    { skill: "Data analysis", frequencyPercent: 72, category: "technical", trending: true },
    { skill: "Product strategy", frequencyPercent: 68, category: "domain", trending: false },
    { skill: "A/B testing", frequencyPercent: 60, category: "technical", trending: false },
    { skill: "SQL", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "User research", frequencyPercent: 52, category: "domain", trending: true },
    { skill: "AI/automation tools", frequencyPercent: 48, category: "tool", trending: true },
    { skill: "Agile/Scrum", frequencyPercent: 45, category: "soft", trending: false },
    { skill: "Stakeholder management", frequencyPercent: 42, category: "soft", trending: false },
    { skill: "Roadmap planning", frequencyPercent: 40, category: "domain", trending: false },
    { skill: "Growth marketing", frequencyPercent: 38, category: "domain", trending: true },
  ],
  "11-9199": [ // Managers, All Other (Project/Program)
    { skill: "Agile/Scrum", frequencyPercent: 70, category: "domain", trending: false },
    { skill: "Stakeholder management", frequencyPercent: 65, category: "soft", trending: false },
    { skill: "Budget management", frequencyPercent: 58, category: "domain", trending: false },
    { skill: "Risk management", frequencyPercent: 55, category: "domain", trending: false },
    { skill: "JIRA/project tools", frequencyPercent: 52, category: "tool", trending: false },
    { skill: "Cross-functional leadership", frequencyPercent: 50, category: "soft", trending: false },
    { skill: "AI workflow automation", frequencyPercent: 42, category: "tool", trending: true },
    { skill: "PMP/PRINCE2", frequencyPercent: 40, category: "certification", trending: false },
    { skill: "Data-driven decision making", frequencyPercent: 38, category: "domain", trending: true },
    { skill: "Change management", frequencyPercent: 35, category: "soft", trending: false },
  ],
  "15-1244": [ // Network/Cloud/DevOps
    { skill: "AWS/Azure/GCP", frequencyPercent: 80, category: "technical", trending: true },
    { skill: "Terraform/IaC", frequencyPercent: 72, category: "tool", trending: true },
    { skill: "Kubernetes", frequencyPercent: 68, category: "technical", trending: true },
    { skill: "Docker", frequencyPercent: 65, category: "tool", trending: false },
    { skill: "CI/CD (Jenkins/GitHub Actions)", frequencyPercent: 62, category: "tool", trending: true },
    { skill: "Linux administration", frequencyPercent: 58, category: "technical", trending: false },
    { skill: "Python/Bash scripting", frequencyPercent: 55, category: "technical", trending: false },
    { skill: "Monitoring (Datadog/Prometheus)", frequencyPercent: 50, category: "tool", trending: true },
    { skill: "Networking (TCP/IP, DNS)", frequencyPercent: 45, category: "technical", trending: false },
    { skill: "Security best practices", frequencyPercent: 42, category: "domain", trending: true },
  ],
  "13-1111": [ // Management Analysts/Consultants
    { skill: "Data analysis", frequencyPercent: 70, category: "technical", trending: true },
    { skill: "Excel/financial modeling", frequencyPercent: 65, category: "tool", trending: false },
    { skill: "PowerPoint/presentations", frequencyPercent: 62, category: "tool", trending: false },
    { skill: "Process improvement", frequencyPercent: 58, category: "domain", trending: false },
    { skill: "SQL/BI tools", frequencyPercent: 52, category: "technical", trending: true },
    { skill: "Stakeholder management", frequencyPercent: 50, category: "soft", trending: false },
    { skill: "AI/automation strategy", frequencyPercent: 45, category: "domain", trending: true },
    { skill: "Change management", frequencyPercent: 42, category: "domain", trending: false },
    { skill: "Project management", frequencyPercent: 40, category: "soft", trending: false },
    { skill: "Industry expertise", frequencyPercent: 38, category: "domain", trending: false },
  ],
  "13-2051": [ // Financial Analysts
    { skill: "Financial modeling", frequencyPercent: 78, category: "technical", trending: false },
    { skill: "Excel (advanced)", frequencyPercent: 75, category: "tool", trending: false },
    { skill: "SQL", frequencyPercent: 60, category: "technical", trending: true },
    { skill: "Python/R", frequencyPercent: 52, category: "technical", trending: true },
    { skill: "Financial reporting", frequencyPercent: 50, category: "domain", trending: false },
    { skill: "Valuation methods", frequencyPercent: 48, category: "domain", trending: false },
    { skill: "BI tools (Tableau/Power BI)", frequencyPercent: 45, category: "tool", trending: true },
    { skill: "AI/ML for finance", frequencyPercent: 38, category: "technical", trending: true },
    { skill: "Risk analysis", frequencyPercent: 35, category: "domain", trending: false },
    { skill: "CFA/CPA", frequencyPercent: 33, category: "certification", trending: false },
  ],
  "11-3021": [ // Computer/IS Managers
    { skill: "Technical leadership", frequencyPercent: 75, category: "soft", trending: false },
    { skill: "Cloud architecture", frequencyPercent: 70, category: "technical", trending: true },
    { skill: "Budget & resource planning", frequencyPercent: 65, category: "domain", trending: false },
    { skill: "AI/ML strategy", frequencyPercent: 58, category: "domain", trending: true },
    { skill: "Security & compliance", frequencyPercent: 55, category: "domain", trending: true },
    { skill: "Agile at scale", frequencyPercent: 50, category: "domain", trending: false },
    { skill: "Vendor management", frequencyPercent: 45, category: "soft", trending: false },
    { skill: "System architecture", frequencyPercent: 42, category: "technical", trending: false },
    { skill: "Hiring & team building", frequencyPercent: 40, category: "soft", trending: false },
    { skill: "Digital transformation", frequencyPercent: 38, category: "domain", trending: true },
  ],
  "15-1254": [ // Web Developers
    { skill: "JavaScript/TypeScript", frequencyPercent: 82, category: "technical", trending: true },
    { skill: "React/Next.js", frequencyPercent: 75, category: "technical", trending: true },
    { skill: "HTML/CSS", frequencyPercent: 70, category: "technical", trending: false },
    { skill: "Node.js", frequencyPercent: 62, category: "technical", trending: false },
    { skill: "REST APIs", frequencyPercent: 58, category: "technical", trending: false },
    { skill: "Git", frequencyPercent: 55, category: "tool", trending: false },
    { skill: "SQL/NoSQL", frequencyPercent: 50, category: "technical", trending: false },
    { skill: "AI-assisted development", frequencyPercent: 42, category: "tool", trending: true },
    { skill: "Performance optimization", frequencyPercent: 38, category: "technical", trending: true },
    { skill: "Accessibility", frequencyPercent: 35, category: "domain", trending: true },
  ],
  "15-1242": [ // Database Administrators
    { skill: "SQL (advanced)", frequencyPercent: 85, category: "technical", trending: false },
    { skill: "Database design", frequencyPercent: 72, category: "technical", trending: false },
    { skill: "Cloud databases (RDS/Cloud SQL)", frequencyPercent: 65, category: "technical", trending: true },
    { skill: "Performance tuning", frequencyPercent: 60, category: "technical", trending: false },
    { skill: "Backup & recovery", frequencyPercent: 55, category: "domain", trending: false },
    { skill: "PostgreSQL/MySQL", frequencyPercent: 52, category: "tool", trending: false },
    { skill: "NoSQL (MongoDB/DynamoDB)", frequencyPercent: 48, category: "technical", trending: true },
    { skill: "Security & encryption", frequencyPercent: 42, category: "domain", trending: true },
    { skill: "Python scripting", frequencyPercent: 38, category: "technical", trending: true },
    { skill: "Data pipeline tools", frequencyPercent: 35, category: "tool", trending: true },
  ],
  "15-1211": [ // Systems Analysts
    { skill: "Requirements analysis", frequencyPercent: 70, category: "domain", trending: false },
    { skill: "SQL", frequencyPercent: 65, category: "technical", trending: false },
    { skill: "Business process mapping", frequencyPercent: 60, category: "domain", trending: false },
    { skill: "Cloud platforms", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "System integration", frequencyPercent: 52, category: "technical", trending: false },
    { skill: "Data analysis", frequencyPercent: 48, category: "technical", trending: true },
    { skill: "Stakeholder communication", frequencyPercent: 45, category: "soft", trending: false },
    { skill: "AI/automation assessment", frequencyPercent: 40, category: "domain", trending: true },
    { skill: "Technical documentation", frequencyPercent: 38, category: "soft", trending: false },
    { skill: "Agile methodology", frequencyPercent: 35, category: "domain", trending: false },
  ],
  "15-1253": [ // QA/Software Testing
    { skill: "Test automation", frequencyPercent: 78, category: "technical", trending: true },
    { skill: "Selenium/Playwright", frequencyPercent: 70, category: "tool", trending: true },
    { skill: "Python/Java", frequencyPercent: 65, category: "technical", trending: false },
    { skill: "CI/CD testing", frequencyPercent: 60, category: "technical", trending: true },
    { skill: "API testing", frequencyPercent: 55, category: "technical", trending: false },
    { skill: "SQL", frequencyPercent: 50, category: "technical", trending: false },
    { skill: "Performance testing", frequencyPercent: 45, category: "technical", trending: false },
    { skill: "AI-powered testing", frequencyPercent: 40, category: "tool", trending: true },
    { skill: "Agile/Scrum", frequencyPercent: 38, category: "domain", trending: false },
    { skill: "Test strategy", frequencyPercent: 35, category: "domain", trending: false },
  ],
  "13-2011": [ // Accountants
    { skill: "GAAP/IFRS", frequencyPercent: 78, category: "domain", trending: false },
    { skill: "Excel (advanced)", frequencyPercent: 75, category: "tool", trending: false },
    { skill: "Tax preparation", frequencyPercent: 62, category: "domain", trending: false },
    { skill: "QuickBooks/Xero", frequencyPercent: 55, category: "tool", trending: false },
    { skill: "Financial reporting", frequencyPercent: 52, category: "domain", trending: false },
    { skill: "ERP systems (SAP/Oracle)", frequencyPercent: 48, category: "tool", trending: false },
    { skill: "Data analysis", frequencyPercent: 42, category: "technical", trending: true },
    { skill: "AI automation tools", frequencyPercent: 35, category: "tool", trending: true },
    { skill: "CPA certification", frequencyPercent: 33, category: "certification", trending: false },
    { skill: "Audit procedures", frequencyPercent: 30, category: "domain", trending: false },
  ],
  "27-3042": [ // Technical Writers
    { skill: "Technical documentation", frequencyPercent: 82, category: "domain", trending: false },
    { skill: "Markdown/docs-as-code", frequencyPercent: 65, category: "tool", trending: true },
    { skill: "API documentation", frequencyPercent: 60, category: "domain", trending: true },
    { skill: "Content management systems", frequencyPercent: 55, category: "tool", trending: false },
    { skill: "Information architecture", frequencyPercent: 50, category: "domain", trending: false },
    { skill: "Git/version control", frequencyPercent: 45, category: "tool", trending: true },
    { skill: "AI writing tools", frequencyPercent: 42, category: "tool", trending: true },
    { skill: "UX writing", frequencyPercent: 38, category: "domain", trending: true },
    { skill: "Visual communication", frequencyPercent: 35, category: "soft", trending: false },
    { skill: "HTML/CSS basics", frequencyPercent: 32, category: "technical", trending: false },
  ],
  "27-1024": [ // Graphic Designers
    { skill: "Adobe Creative Suite", frequencyPercent: 80, category: "tool", trending: false },
    { skill: "Figma", frequencyPercent: 72, category: "tool", trending: true },
    { skill: "Typography", frequencyPercent: 60, category: "domain", trending: false },
    { skill: "Brand design", frequencyPercent: 55, category: "domain", trending: false },
    { skill: "UI design", frequencyPercent: 50, category: "technical", trending: true },
    { skill: "AI design tools (Midjourney/DALL-E)", frequencyPercent: 45, category: "tool", trending: true },
    { skill: "Motion graphics", frequencyPercent: 42, category: "technical", trending: true },
    { skill: "Print & digital production", frequencyPercent: 38, category: "domain", trending: false },
    { skill: "Design systems", frequencyPercent: 35, category: "technical", trending: true },
    { skill: "Communication", frequencyPercent: 32, category: "soft", trending: false },
  ],
  "41-9031": [ // Sales Engineers
    { skill: "Technical presentations", frequencyPercent: 75, category: "soft", trending: false },
    { skill: "CRM (Salesforce)", frequencyPercent: 70, category: "tool", trending: false },
    { skill: "Solution architecture", frequencyPercent: 65, category: "domain", trending: false },
    { skill: "API/integration knowledge", frequencyPercent: 58, category: "technical", trending: true },
    { skill: "Cloud platforms", frequencyPercent: 55, category: "technical", trending: true },
    { skill: "Relationship building", frequencyPercent: 52, category: "soft", trending: false },
    { skill: "AI/ML product knowledge", frequencyPercent: 45, category: "domain", trending: true },
    { skill: "Demo/POC delivery", frequencyPercent: 42, category: "domain", trending: false },
    { skill: "Competitive analysis", frequencyPercent: 38, category: "domain", trending: false },
    { skill: "Negotiation", frequencyPercent: 35, category: "soft", trending: false },
  ],
};

// Top metro areas by SOC code - employment concentration and salary data
// Sourced from BLS OEWS area-level data
const GEOGRAPHIC_HOTSPOTS: Record<string, GeographicHotspot[]> = {
  "15-1252": [ // Software Developers
    { metro: "San Jose-Sunnyvale-Santa Clara", state: "CA", salaryMedian: 184000, salaryP75: 220000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "Seattle-Tacoma-Bellevue", state: "WA", salaryMedian: 168000, salaryP75: 200000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 172000, salaryP75: 210000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "New York-Newark", state: "NY", salaryMedian: 148000, salaryP75: 185000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Austin-Round Rock", state: "TX", salaryMedian: 140000, salaryP75: 175000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Denver-Aurora", state: "CO", salaryMedian: 138000, salaryP75: 170000, employmentConcentration: "high", remoteAvailability: "high" },
  ],
  "15-2051": [ // Data Scientists
    { metro: "San Jose-Sunnyvale-Santa Clara", state: "CA", salaryMedian: 175000, salaryP75: 210000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 165000, salaryP75: 200000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "New York-Newark", state: "NY", salaryMedian: 145000, salaryP75: 180000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Seattle-Tacoma-Bellevue", state: "WA", salaryMedian: 155000, salaryP75: 192000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Washington-Arlington", state: "DC", salaryMedian: 135000, salaryP75: 168000, employmentConcentration: "high", remoteAvailability: "moderate" },
    { metro: "Boston-Cambridge", state: "MA", salaryMedian: 140000, salaryP75: 175000, employmentConcentration: "high", remoteAvailability: "high" },
  ],
  "15-1212": [ // Information Security Analysts
    { metro: "Washington-Arlington", state: "DC", salaryMedian: 138000, salaryP75: 172000, employmentConcentration: "very-high", remoteAvailability: "moderate" },
    { metro: "San Jose-Sunnyvale-Santa Clara", state: "CA", salaryMedian: 155000, salaryP75: 190000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "New York-Newark", state: "NY", salaryMedian: 132000, salaryP75: 165000, employmentConcentration: "high", remoteAvailability: "moderate" },
    { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 148000, salaryP75: 182000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Dallas-Fort Worth", state: "TX", salaryMedian: 118000, salaryP75: 148000, employmentConcentration: "moderate", remoteAvailability: "high" },
    { metro: "Chicago-Naperville", state: "IL", salaryMedian: 115000, salaryP75: 145000, employmentConcentration: "moderate", remoteAvailability: "moderate" },
  ],
  "11-2021": [ // Marketing/Product Managers
    { metro: "San Jose-Sunnyvale-Santa Clara", state: "CA", salaryMedian: 195000, salaryP75: 235000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "New York-Newark", state: "NY", salaryMedian: 175000, salaryP75: 215000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 188000, salaryP75: 228000, employmentConcentration: "very-high", remoteAvailability: "high" },
    { metro: "Seattle-Tacoma-Bellevue", state: "WA", salaryMedian: 168000, salaryP75: 205000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Chicago-Naperville", state: "IL", salaryMedian: 142000, salaryP75: 178000, employmentConcentration: "high", remoteAvailability: "moderate" },
    { metro: "Boston-Cambridge", state: "MA", salaryMedian: 158000, salaryP75: 198000, employmentConcentration: "high", remoteAvailability: "high" },
  ],
  "13-1111": [ // Management Analysts
    { metro: "Washington-Arlington", state: "DC", salaryMedian: 118000, salaryP75: 152000, employmentConcentration: "very-high", remoteAvailability: "moderate" },
    { metro: "New York-Newark", state: "NY", salaryMedian: 115000, salaryP75: 148000, employmentConcentration: "high", remoteAvailability: "moderate" },
    { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 125000, salaryP75: 160000, employmentConcentration: "high", remoteAvailability: "high" },
    { metro: "Boston-Cambridge", state: "MA", salaryMedian: 112000, salaryP75: 145000, employmentConcentration: "high", remoteAvailability: "moderate" },
    { metro: "Chicago-Naperville", state: "IL", salaryMedian: 102000, salaryP75: 135000, employmentConcentration: "moderate", remoteAvailability: "moderate" },
    { metro: "Dallas-Fort Worth", state: "TX", salaryMedian: 98000, salaryP75: 130000, employmentConcentration: "moderate", remoteAvailability: "moderate" },
  ],
};

// Default hotspots for roles without specific metro data
const DEFAULT_HOTSPOTS: GeographicHotspot[] = [
  { metro: "San Jose-Sunnyvale-Santa Clara", state: "CA", salaryMedian: 150000, salaryP75: 185000, employmentConcentration: "very-high", remoteAvailability: "high" },
  { metro: "New York-Newark", state: "NY", salaryMedian: 130000, salaryP75: 165000, employmentConcentration: "high", remoteAvailability: "moderate" },
  { metro: "San Francisco-Oakland", state: "CA", salaryMedian: 145000, salaryP75: 180000, employmentConcentration: "high", remoteAvailability: "high" },
  { metro: "Seattle-Tacoma-Bellevue", state: "WA", salaryMedian: 138000, salaryP75: 172000, employmentConcentration: "high", remoteAvailability: "high" },
  { metro: "Washington-Arlington", state: "DC", salaryMedian: 120000, salaryP75: 155000, employmentConcentration: "high", remoteAvailability: "moderate" },
  { metro: "Austin-Round Rock", state: "TX", salaryMedian: 118000, salaryP75: 150000, employmentConcentration: "moderate", remoteAvailability: "high" },
];

function buildDemandSignal(socCode: string, employment: number): DemandSignal {
  const growth = GROWTH_RATES[socCode];
  const growthPercent = growth?.percent ?? 5;

  let trend: DemandSignal["trend"];
  let trendStrength: DemandSignal["trendStrength"];
  if (growthPercent >= 20) {
    trend = "growing";
    trendStrength = "strong";
  } else if (growthPercent >= 10) {
    trend = "growing";
    trendStrength = "moderate";
  } else if (growthPercent >= 3) {
    trend = "stable";
    trendStrength = "moderate";
  } else if (growthPercent >= 0) {
    trend = "stable";
    trendStrength = "weak";
  } else {
    trend = "declining";
    trendStrength = growthPercent < -5 ? "strong" : "moderate";
  }

  let postingVolume: DemandSignal["postingVolume"];
  if (employment >= 1000000) postingVolume = "very-high";
  else if (employment >= 400000) postingVolume = "high";
  else if (employment >= 150000) postingVolume = "moderate";
  else postingVolume = "low";

  return {
    trend,
    trendStrength,
    growthPercent,
    totalEmployment: employment,
    postingVolume,
    yoyGrowthLabel: growth?.label ?? "Data unavailable",
  };
}

export async function fetchMarketContext(role: string): Promise<MarketContext | null> {
  const soc = findSOC(role);
  if (!soc) return null;

  const marketData = await fetchMarketData(role);
  if (!marketData) return null;

  const demand = buildDemandSignal(soc.code, marketData.totalEmployment);
  const topSkills = ROLE_SKILLS[soc.code] ?? [];
  const hotspots = GEOGRAPHIC_HOTSPOTS[soc.code] ?? DEFAULT_HOTSPOTS;

  return {
    role: marketData.role,
    socCode: soc.code,
    salary: {
      p25: marketData.salaryP25,
      p50: marketData.salaryMedian,
      p75: marketData.salaryP75,
    },
    demand,
    topSkills,
    geographicHotspots: hotspots,
    source: marketData.source,
    updatedAt: marketData.updatedAt,
  };
}
