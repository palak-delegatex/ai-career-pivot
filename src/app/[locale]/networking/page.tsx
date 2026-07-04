import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import NetworkingClient from "./NetworkingClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Networking CRM — AICareerPivot",
  description: "Track your professional contacts, follow-ups, and networking relationships.",
  alternates: alternatesFor("/networking", locale),
};
}

export default function NetworkingPage() {
  const crumbs = breadcrumbSchema([{ name: "Networking", path: "/networking" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <NetworkingClient />
      </div>
    </>
  );
}
