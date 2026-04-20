import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "AICareerPivot — Your AI-Powered Career Transition Strategist",
  description:
    "AICareerPivot builds personalized career transition roadmaps by analyzing your skills, financial situation, and family constraints. Get a custom 6-month, 1-year, and 2-year career pivot plan.",
  alternates: {
    canonical: "https://ai-career-pivot.com",
  },
  openGraph: {
    url: "https://ai-career-pivot.com",
    title: "AICareerPivot — Your AI-Powered Career Transition Strategist",
    description:
      "Personalized AI-powered career pivot roadmaps for professionals who need to account for skills, finances, and family constraints.",
    images: [{ url: "https://ai-career-pivot.com/og-home.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AICareerPivot — Your AI-Powered Career Transition Strategist",
    description:
      "Personalized AI-powered career pivot roadmaps for professionals who need to account for skills, finances, and family constraints.",
    images: ["https://ai-career-pivot.com/og-home.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AICareerPivot",
  url: "https://ai-career-pivot.com",
  description:
    "AI-powered personalized career transition roadmaps for professionals.",
  sameAs: ["https://twitter.com/aicareer_pivot"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AICareerPivot",
  url: "https://ai-career-pivot.com",
  description:
    "Personalized career transition roadmaps powered by AI. Analyzes your skills, finances, and constraints to build actionable pivot plans.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ai-career-pivot.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  const recentPosts = getAllPosts().slice(0, 3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema]),
        }}
      />
      <HomeClient recentPosts={recentPosts} />
    </>
  );
}
