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
