import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { tools } from "@/content/tools-directory";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import {
  Map,
  BarChart3,
  FileText,
  Mic,
  Link2,
  Mail,
  CheckCircle,
  Kanban,
  Users,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Map,
  BarChart3,
  FileText,
  Mic,
  Linkedin: Link2,
  Mail,
  CheckCircle,
  Kanban,
  Users,
};

const BASE_URL = "https://ai-career-pivot.com";

export const metadata: Metadata = {
  title: "Free Career Pivot Tools — AICareerPivot",
  description:
    "9 free AI-powered career pivot tools: roadmap builder, gap analysis, resume generator, mock interview, LinkedIn optimizer, cover letter generator, ATS checker, job tracker, and networking CRM.",
  alternates: { canonical: `${BASE_URL}/tools` },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/tools`,
    title: "Free Career Pivot Tools — AICareerPivot",
    description:
      "All 9 free tools for your career transition: resume, interview prep, LinkedIn, ATS scoring, job tracking, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Career Pivot Tools — AICareerPivot",
    description:
      "9 AI-powered career pivot tools, free. Resume builder, mock interviews, ATS checker, and more.",
  },
};

export default function ToolsPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AICareerPivot Free Career Pivot Tools",
    description:
      "A comprehensive suite of 9 free AI-powered tools for career transition and job search.",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        url: `${BASE_URL}${tool.href}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        provider: {
          "@type": "Organization",
          name: "AICareerPivot",
          url: BASE_URL,
        },
      },
    })),
  };

  const crumbs = breadcrumbSchema([{ name: "Tools", path: "/tools" }]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemListSchema, organizationSchema(), crumbs]),
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Free Career Pivot Tools
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to plan and execute your career transition — 9
            AI-powered tools, all free.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = ICON_MAP[tool.icon];
            return (
              <div
                key={tool.slug}
                className="group p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-teal-600 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  {Icon && (
                    <div className="p-2 rounded-lg bg-teal-950 border border-teal-800 shrink-0">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs uppercase tracking-wider text-teal-500 font-medium">
                      {tool.category}
                    </span>
                    <h2 className="text-lg font-semibold text-white mt-1">
                      {tool.name}
                    </h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {tool.description}
                </p>
                <Link
                  href={tool.href}
                  className="inline-block px-4 py-2 text-sm font-semibold text-teal-400 border border-teal-700 rounded-lg hover:bg-teal-950 transition-colors"
                >
                  Try Free →
                </Link>
              </div>
            );
          })}
        </div>

        <section className="mt-16 text-center">
          <div className="p-8 rounded-2xl bg-teal-950 border border-teal-800">
            <p className="text-teal-300 font-semibold text-lg mb-2">
              Want a complete career pivot roadmap?
            </p>
            <p className="text-slate-400 text-sm mb-5">
              Combine all tools into a personalized 6-month, 1-year, or 2-year
              transition plan with financial modeling.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
            >
              Get My Roadmap — $19 →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
