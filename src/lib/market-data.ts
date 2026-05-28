import type { MarketData } from "./intake";

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
