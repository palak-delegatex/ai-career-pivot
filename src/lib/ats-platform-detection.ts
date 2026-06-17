// ATS platform detection from job URLs, job description text, and company signals.

export type ATSPlatform =
  | "greenhouse"
  | "lever"
  | "workday"
  | "taleo"
  | "icims"
  | "smartrecruiters"
  | "unknown";

export interface ATSDetectionResult {
  platform: ATSPlatform;
  confidence: "high" | "medium" | "low";
  signals: string[];
}

interface DetectionRule {
  platform: ATSPlatform;
  urlPatterns: RegExp[];
  textSignals: { pattern: RegExp; weight: number }[];
}

const DETECTION_RULES: DetectionRule[] = [
  {
    platform: "greenhouse",
    urlPatterns: [
      /boards\.greenhouse\.io/i,
      /greenhouse\.io\/.*\/jobs/i,
      /grnh\.se\//i,
    ],
    textSignals: [
      { pattern: /greenhouse/i, weight: 3 },
      { pattern: /boards\.greenhouse/i, weight: 5 },
      { pattern: /apply.*greenhouse/i, weight: 4 },
      { pattern: /powered\s+by\s+greenhouse/i, weight: 5 },
    ],
  },
  {
    platform: "lever",
    urlPatterns: [
      /jobs\.lever\.co/i,
      /lever\.co\/.*\/apply/i,
    ],
    textSignals: [
      { pattern: /lever\.co/i, weight: 5 },
      { pattern: /jobs\.lever/i, weight: 5 },
      { pattern: /powered\s+by\s+lever/i, weight: 5 },
      { pattern: /lever\s+ats/i, weight: 4 },
    ],
  },
  {
    platform: "workday",
    urlPatterns: [
      /myworkdayjobs\.com/i,
      /\.wd\d+\.myworkdayjobs/i,
      /workday\.com.*\/job/i,
      /\.wd\d+\.myworkday\.com/i,
    ],
    textSignals: [
      { pattern: /workday/i, weight: 3 },
      { pattern: /myworkdayjobs/i, weight: 5 },
      { pattern: /workday\s+(?:ats|hcm|recruiting)/i, weight: 4 },
      { pattern: /powered\s+by\s+workday/i, weight: 5 },
      { pattern: /\.wd\d+\./i, weight: 5 },
    ],
  },
  {
    platform: "taleo",
    urlPatterns: [
      /taleo\.net/i,
      /oracle.*taleo/i,
      /\.taleo\.net\/careersection/i,
    ],
    textSignals: [
      { pattern: /taleo/i, weight: 4 },
      { pattern: /oracle\s+taleo/i, weight: 5 },
      { pattern: /taleo\.net/i, weight: 5 },
      { pattern: /careersection/i, weight: 3 },
      { pattern: /powered\s+by\s+taleo/i, weight: 5 },
    ],
  },
  {
    platform: "icims",
    urlPatterns: [
      /icims\.com/i,
      /\.icims\.com\/jobs/i,
      /careers-.*\.icims\.com/i,
    ],
    textSignals: [
      { pattern: /icims/i, weight: 4 },
      { pattern: /icims\.com/i, weight: 5 },
      { pattern: /powered\s+by\s+icims/i, weight: 5 },
      { pattern: /i-?cims/i, weight: 3 },
    ],
  },
  {
    platform: "smartrecruiters",
    urlPatterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters\.com/i,
    ],
    textSignals: [
      { pattern: /smartrecruiters/i, weight: 4 },
      { pattern: /smart\s+recruiters/i, weight: 3 },
      { pattern: /jobs\.smartrecruiters/i, weight: 5 },
      { pattern: /powered\s+by\s+smartrecruiters/i, weight: 5 },
    ],
  },
];

// Companies known to use specific ATS platforms (large employers)
const COMPANY_ATS_MAP: Record<string, ATSPlatform> = {
  "airbnb": "greenhouse",
  "stripe": "greenhouse",
  "figma": "greenhouse",
  "notion": "greenhouse",
  "datadog": "greenhouse",
  "cloudflare": "greenhouse",
  "twitch": "greenhouse",
  "pinterest": "greenhouse",
  "hubspot": "greenhouse",
  "netflix": "lever",
  "shopify": "greenhouse",
  "spotify": "greenhouse",
  "lyft": "greenhouse",
  "instacart": "greenhouse",
  "coinbase": "greenhouse",
  "atlassian": "lever",
  "twilio": "lever",
  "mongodb": "lever",
  "databricks": "lever",
  "oracle": "taleo",
  "deloitte": "taleo",
  "kpmg": "taleo",
  "pwc": "workday",
  "ey": "workday",
  "accenture": "workday",
  "amazon": "workday",
  "walmart": "workday",
  "target": "workday",
  "disney": "workday",
  "nike": "workday",
  "starbucks": "workday",
  "johnson & johnson": "workday",
  "procter & gamble": "workday",
  "microsoft": "workday",
  "salesforce": "workday",
  "adobe": "workday",
  "jpmorgan": "workday",
  "goldman sachs": "workday",
  "bank of america": "workday",
  "wells fargo": "workday",
  "citigroup": "icims",
  "comcast": "icims",
  "fedex": "icims",
  "ups": "icims",
  "under armour": "icims",
};

export function detectATSPlatform(options: {
  jobUrl?: string;
  jobDescription?: string;
  companyName?: string;
}): ATSDetectionResult {
  const signals: string[] = [];
  const scores: Record<ATSPlatform, number> = {
    greenhouse: 0,
    lever: 0,
    workday: 0,
    taleo: 0,
    icims: 0,
    smartrecruiters: 0,
    unknown: 0,
  };

  // URL-based detection (highest confidence)
  if (options.jobUrl) {
    for (const rule of DETECTION_RULES) {
      for (const pattern of rule.urlPatterns) {
        if (pattern.test(options.jobUrl)) {
          scores[rule.platform] += 10;
          signals.push(`URL matches ${rule.platform} pattern`);
        }
      }
    }
  }

  // Text-based detection from job description
  if (options.jobDescription) {
    for (const rule of DETECTION_RULES) {
      for (const sig of rule.textSignals) {
        if (sig.pattern.test(options.jobDescription)) {
          scores[rule.platform] += sig.weight;
          signals.push(`JD text matches ${rule.platform}: ${sig.pattern.source}`);
        }
      }
    }
  }

  // Company name lookup
  if (options.companyName) {
    const normalizedCompany = options.companyName.toLowerCase().trim();
    for (const [company, platform] of Object.entries(COMPANY_ATS_MAP)) {
      if (
        normalizedCompany.includes(company) ||
        company.includes(normalizedCompany)
      ) {
        scores[platform] += 6;
        signals.push(`Company "${options.companyName}" is known to use ${platform}`);
      }
    }
  }

  let bestPlatform: ATSPlatform = "unknown";
  let bestScore = 0;
  for (const [platform, score] of Object.entries(scores)) {
    if (platform !== "unknown" && score > bestScore) {
      bestScore = score;
      bestPlatform = platform as ATSPlatform;
    }
  }

  let confidence: "high" | "medium" | "low";
  if (bestScore >= 8) confidence = "high";
  else if (bestScore >= 4) confidence = "medium";
  else if (bestScore > 0) confidence = "low";
  else {
    return { platform: "unknown", confidence: "low", signals: [] };
  }

  return { platform: bestPlatform, confidence, signals };
}
