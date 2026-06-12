import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import NetworkingClient from "./NetworkingClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Networking CRM — AICareerPivot",
  description: "Track your professional contacts, follow-ups, and networking relationships.",
  alternates: { canonical: "https://ai-career-pivot.com/networking" },
};

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
