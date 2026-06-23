import { type Locale, defaultLocale, localePath, localeUrl } from "@/i18n/config";

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
  locale: Locale = defaultLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: localeUrl("/", locale),
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: localeUrl(item.path, locale),
      })),
    ],
  };
}

export function blogPostingSchema(
  post: {
    title: string;
    description: string;
    date: string;
    lastModified: string;
    keywords: string[];
    slug: string;
  },
  locale: Locale = defaultLocale,
) {
  const url = localeUrl(`/blog/${post.slug}`, locale);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.lastModified,
    inLanguage: locale,
    author: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: BASE_URL,
    },
    publisher: organizationSchema(),
    url,
    keywords: post.keywords.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
