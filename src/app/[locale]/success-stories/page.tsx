import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SuccessStoriesClient from "./SuccessStoriesClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Success Stories | AICareerPivot",
  description:
    "Real career transition stories from professionals who pivoted successfully with AICareerPivot. See data-driven outcomes and proven roadmaps.",
  alternates: alternatesFor("/success-stories", locale),
  openGraph: {
    locale: ogLocaleFor(locale),
    title: "Career Pivot Success Stories | AICareerPivot",
    description:
      "Nurse → UX Designer. Teacher → Product Manager. See real career transitions with concrete data.",
    type: "website",
  },
};
}

export default function SuccessStoriesPage() {
  const crumbs = breadcrumbSchema([{ name: "Success Stories", path: "/success-stories" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <SuccessStoriesClient />
    </>
  );
}
