const BASE_URL = "https://ai-career-pivot.com";

const ENTITY_DESCRIPTION =
  "AICareerPivot is an AI-powered career strategist that builds personalized transition roadmaps by analyzing skills, financial constraints, and family circumstances.";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AICareerPivot",
    url: BASE_URL,
    description: ENTITY_DESCRIPTION,
    sameAs: [
      "https://twitter.com/aicareer_pivot",
      "https://www.linkedin.com/company/aicareerpivot",
      "https://chromewebstore.google.com/detail/aicareerpivot",
    ],
  };
}

export interface HowToStepInput {
  name: string;
  text: string;
  url?: string;
}

/**
 * HowTo JSON-LD for procedural blog posts (AIC-1192). Frontmatter-driven via a
 * post's `howto.steps` array so it only emits on posts an author has curated —
 * no risky content-derived scraping, no per-post manual chore beyond the
 * frontmatter. Mirrors the conditional FAQPage assembly in the blog route.
 * Each step gets a stable anchor URL (`#step-N`) unless one is supplied.
 */
export function howToSchema(opts: {
  name: string;
  description?: string;
  steps: HowToStepInput[];
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: s.url ?? `${opts.url}#step-${i + 1}`,
    })),
  };
}

/**
 * SpeakableSpecification (AIC-1192) — tells voice/answer engines which parts of
 * the page are the concise, spoken-answer-ready sections. We target the TL;DR
 * block and the FAQ by stable id. Attached to the article/WebPage schema only
 * when those sections actually render.
 */
export function speakableSchema(cssSelectors: string[]) {
  return {
    "@type": "SpeakableSpecification",
    cssSelector: cssSelectors,
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${BASE_URL}${item.path}`,
      })),
    ],
  };
}
