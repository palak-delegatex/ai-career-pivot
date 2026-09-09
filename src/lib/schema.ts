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

/**
 * HowTo JSON-LD for procedural blog posts (AIC-1190). Mirrors the static HowTo
 * on /how-it-works but is driven by post frontmatter so it stays automated with
 * no per-post chore. Returns null when a post has no `howto:` steps so callers
 * can conditionally append it exactly like the FAQPage assembly.
 */
export function howToSchema(opts: {
  name: string;
  description: string;
  url: string;
  dateModified: string;
  steps: { name: string; text: string }[];
}) {
  if (!opts.steps || opts.steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    dateModified: opts.dateModified,
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/**
 * SpeakableSpecification (AIC-1190) — flags the TL;DR summary and FAQ blocks as
 * the concise, quotable regions of the page for voice/answer engines. The
 * cssSelectors must match stable class hooks rendered in the blog post markup.
 */
export function speakableSpecification(cssSelector: string[]) {
  return {
    "@type": "SpeakableSpecification",
    cssSelector,
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
