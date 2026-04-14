export interface Course {
  id: string;
  name: string;
  provider: string;
  providerShort: string;
  tier: "free" | "paid-entry" | "paid-pro";
  cost: string;
  duration: string;
  valueprop: string;
  roiStat?: string;
  badge: string; // short label for the cost/tier badge
  url: string;
  featured: boolean;
}

// Curated courses for the landing page "AI Skills That Actually Get You Hired" section.
// CTO: render these as cards in a grid. Show `featured: true` items by default (6 cards).
// Include provider logo from /images/courses/{providerShort}.svg (you'll need to source these).
// The "Match score" shown to logged-in users is calculated post-signup — placeholder here.
export const courses: Course[] = [
  {
    id: "anthropic-ai-fluency",
    name: "AI Fluency: Framework & Foundations",
    provider: "Anthropic",
    providerShort: "anthropic",
    tier: "free",
    cost: "Free",
    duration: "3–4 hours",
    valueprop:
      "Straight from the team that built Claude. Learn how to actually work with AI — structured prompting, safety, ethics, and getting reliable results. This is table stakes for every role in 2026.",
    badge: "Free",
    url: "https://anthropic.skilljar.com/",
    featured: true,
  },
  {
    id: "google-ai-essentials",
    name: "Google AI Essentials",
    provider: "Google",
    providerShort: "google",
    tier: "free",
    cost: "~$49/mo",
    duration: "Under 10 hours",
    valueprop:
      "Google's official AI skills path for non-technical professionals. Covers AI fundamentals, productivity tools, responsible AI, and effective prompting — all with a verifiable Google certificate.",
    badge: "Beginner",
    url: "https://grow.google/ai-essentials/",
    featured: true,
  },
  {
    id: "aws-ai-scholars",
    name: "AWS AI & ML Scholars Program",
    provider: "Amazon Web Services",
    providerShort: "aws",
    tier: "free",
    cost: "Free",
    duration: "Self-paced",
    valueprop:
      "AWS's free learning path that preps you for the AI Practitioner cert. Project-based, cloud-native, and open through June 2026. The most cost-efficient on-ramp to an AWS credential.",
    badge: "Free · Open 2026",
    url: "https://aws.amazon.com/training/",
    featured: true,
  },
  {
    id: "aws-ai-practitioner",
    name: "AWS Certified AI Practitioner",
    provider: "Amazon Web Services",
    providerShort: "aws",
    tier: "paid-entry",
    cost: "~$150 exam",
    duration: "1–3 months",
    valueprop:
      "The new AWS entry-level AI cert that hiring managers notice. Validates foundational AI/ML/GenAI knowledge without requiring coding. Holders report 20–25% salary bumps in their next role.",
    roiStat: "~20% avg salary bump",
    badge: "High ROI",
    url: "https://aws.amazon.com/certification/certified-ai-practitioner/",
    featured: true,
  },
  {
    id: "azure-ai-fundamentals",
    name: "Azure AI Fundamentals (AI-901)",
    provider: "Microsoft",
    providerShort: "microsoft",
    tier: "paid-entry",
    cost: "~$165 exam",
    duration: "1–2 months",
    valueprop:
      "The must-have cert for enterprise professionals. Covers building AI apps and intelligent agents with Microsoft Foundry — the AI platform now embedded across the Office 365 ecosystem.",
    badge: "Enterprise",
    url: "https://learn.microsoft.com/en-us/certifications/",
    featured: true,
  },
  {
    id: "google-ml-engineer",
    name: "Professional ML Engineer",
    provider: "Google Cloud",
    providerShort: "google",
    tier: "paid-pro",
    cost: "~$200 exam",
    duration: "3–6 months",
    valueprop:
      "The highest-ROI technical cert in this list. Validates end-to-end ML pipeline skills on Google Cloud. Holders report ~25% salary increases and consistently appear in $200k+ compensation packages.",
    roiStat: "~25% avg salary bump",
    badge: "Top ROI",
    url: "https://cloud.google.com/learn/certification/machine-learning-engineer",
    featured: true,
  },
  {
    id: "aws-genai-developer",
    name: "Certified GenAI Developer – Professional",
    provider: "Amazon Web Services",
    providerShort: "aws",
    tier: "paid-pro",
    cost: "~$300 exam",
    duration: "3–6 months",
    valueprop:
      "AWS's newest professional-tier AI cert, just launched in 2026. Covers RAG, foundation model customization, and responsible GenAI deployment. Scarce credential = premium hiring value right now.",
    badge: "New 2026",
    url: "https://aws.amazon.com/certification/",
    featured: false,
  },
  {
    id: "azure-ai-developer",
    name: "Azure AI App & Agent Developer (AI-103)",
    provider: "Microsoft",
    providerShort: "microsoft",
    tier: "paid-pro",
    cost: "~$165 exam",
    duration: "3–4 months",
    valueprop:
      "Microsoft's new hands-on developer cert for building production AI apps and agents on Azure. Launching beta April 2026 — early adopters get a scarce, high-demand credential.",
    badge: "Beta Apr 2026",
    url: "https://learn.microsoft.com/en-us/certifications/",
    featured: false,
  },
  {
    id: "ibm-genai-engineering",
    name: "Generative AI Engineering Professional Certificate",
    provider: "IBM",
    providerShort: "ibm",
    tier: "paid-entry",
    cost: "~$49/mo",
    duration: "3–4 months",
    valueprop:
      "IBM's refreshed GenAI engineering certificate (updated Mar 2025) covering foundation model workflows and modern GenAI techniques. Good foundation for developers entering the GenAI space.",
    badge: "Updated 2025",
    url: "https://www.coursera.org/professional-certificates/ibm-generative-ai-engineering",
    featured: false,
  },
  {
    id: "pmi-ai",
    name: "PMI AI Certification",
    provider: "PMI",
    providerShort: "pmi",
    tier: "paid-pro",
    cost: "~$555",
    duration: "2–4 months",
    valueprop:
      "The first major AI certification for project managers. Covers the 6-phase AI project methodology. High price tag, but PMI brand = instant enterprise credibility for managers pivoting into AI leadership.",
    badge: "PM Leadership",
    url: "https://www.pmi.org/certifications/artificial-intelligence-certification",
    featured: false,
  },
] as const;

export const featuredCourses = courses.filter((c) => c.featured);
