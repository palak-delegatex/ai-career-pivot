import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "AI Career Pivot — Your Personalized Career Transition Roadmap",
  description:
    "Get your personalized career transition roadmap for $9 early access. AI Career Pivot analyzes your skills, financial situation, and family constraints to build a custom 6-month, 1-year, and 2-year career pivot plan.",
  alternates: {
    canonical: "https://ai-career-pivot.com",
  },
  openGraph: {
    url: "https://ai-career-pivot.com",
    title: "AI Career Pivot — Your Personalized Career Transition Roadmap",
    description:
      "Get your personalized career transition roadmap for $9 early access. Built around your skills, finances, and family constraints — not generic advice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Career Pivot — Your Personalized Career Transition Roadmap",
    description:
      "Get your personalized career transition roadmap for $9 early access. Built around your skills, finances, and family constraints.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AI Career Pivot",
  url: "https://ai-career-pivot.com",
  description:
    "AI-powered personalized career transition roadmaps for professionals.",
  sameAs: ["https://twitter.com/aicareer_pivot"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AI Career Pivot",
  url: "https://ai-career-pivot.com",
  description:
    "Personalized career transition roadmaps powered by AI. Analyzes your skills, finances, and constraints to build actionable pivot plans.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ai-career-pivot.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "AI Career Pivot — Personalized Career Transition Roadmap",
  url: "https://ai-career-pivot.com",
  description:
    "AI-powered personalized career transition roadmap that analyzes your skills, financial situation, and family constraints to build actionable 6-month, 1-year, and 2-year career pivot plans.",
  brand: {
    "@type": "Brand",
    name: "AI Career Pivot",
  },
  offers: {
    "@type": "Offer",
    price: "9",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
    url: "https://ai-career-pivot.com/waitlist",
    description: "Early access pricing",
  },
};

export default function Page() {
  const recentPosts = getAllPosts().slice(0, 3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema, productSchema]),
        }}
      />
      <HomeClient recentPosts={recentPosts} />
    </>
  );
}
