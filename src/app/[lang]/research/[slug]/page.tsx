import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { getResearch, getAllResearchSlugs } from "@/content/research";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";

export async function generateStaticParams() {
  return getAllResearchSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getResearch(slug);
  if (!data) return {};

  const url = `https://ai-career-pivot.com/research/${slug}`;
  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: data.title,
      description: data.description,
      publishedTime: data.publishedDate,
      modifiedTime: data.lastModified,
      authors: data.authors,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getResearch(slug);
  if (!data) notFound();

  const url = `https://ai-career-pivot.com/research/${slug}`;

  const reportSchema = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: data.title,
    description: data.description,
    url,
    datePublished: data.publishedDate,
    dateModified: data.lastModified,
    author: data.authors.map((name) => ({
      "@type": "Person",
      name,
    })),
    publisher: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
  };

  const crumbs = breadcrumbSchema([
    { name: "Research", path: "/research" },
    { name: data.title, path: `/research/${slug}` },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([reportSchema, organizationSchema(), crumbs]),
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-12">
          <p className="text-teal-400 text-sm font-medium uppercase tracking-wider mb-2">
            Research
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{data.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>By {data.authors.join(", ")}</span>
            <span>Published {data.publishedDate}</span>
            <span>Updated {data.lastModified}</span>
          </div>
        </header>

        {/* Key Findings */}
        {data.keyFindings.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Key Findings</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.keyFindings.map((finding) => (
                <div
                  key={finding.stat}
                  className="p-4 rounded-xl bg-teal-950/50 border border-teal-800"
                >
                  <p className="text-2xl font-bold text-teal-400 mb-1">
                    {finding.stat}
                  </p>
                  <p className="text-slate-400 text-sm">{finding.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Content Sections */}
        {data.sections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </section>
        ))}

        {/* Methodology */}
        {data.methodology && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Methodology</h2>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-300 leading-relaxed">{data.methodology}</p>
            </div>
          </section>
        )}

        {/* Citations */}
        {data.citations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Sources & Citations</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
              {data.citations.map((cite, i) => (
                <li key={i}>
                  {cite.url ? (
                    <a
                      href={cite.url}
                      className="text-teal-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {cite.text}
                    </a>
                  ) : (
                    cite.text
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}
