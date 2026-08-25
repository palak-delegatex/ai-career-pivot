import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import FreeUploadClient from "./FreeUploadClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "Free Skill-Gap Snapshot — AICareerPivot",
    description: "Upload your resume and get a free skill-gap analysis. See which career pivots fit you best — no payment required.",
    alternates: alternatesFor("/free", locale),
  };
}

export default async function FreePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // High-intent visitors arrive via the hero/sticky CTA as `/free?mode=upload`.
  // Resolve that on the server so the client's first paint already shows the
  // upload form — no post-hydration quickcheck→upload flip (kills the flicker +
  // its CLS) and lets us drop the competing entry-mode choice for that path
  // (AIC-1097 friction cut). Reading searchParams opts this route into dynamic
  // rendering, which is fine — the page is a thin shell over a client form.
  const initialMode = (await searchParams).mode === "upload" ? "upload" : "quickcheck";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      {/* Single server-rendered heading stack for /free (AIC-1070). Both entry
          modes (quick-check + upload) share this one H1 — the per-mode client
          headings were removed to kill the double-heading. Server-rendered so it
          is the LCP text and paints without waiting for the client bundle
          (complements the AIC-1067 CWV work on this branch). */}
      <div className="max-w-lg mx-auto px-6 pt-16 pb-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          Free · No signup required
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          See where AI could take your career
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Free skill-gap snapshot in 30 seconds — upload your resume or paste a job posting. No signup, no credit card.
        </p>
      </div>
      <FreeUploadClient initialMode={initialMode} />
    </div>
  );
}
