import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SalaryNegotiationClient from "./SalaryNegotiationClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Salary Negotiation Coach — AICareerPivot",
  description:
    "AI-powered salary negotiation coaching with market data, role-play practice, counter-offer generator, and personalized talking points.",
  alternates: { canonical: "https://ai-career-pivot.com/salary-negotiation" },
};

export default function SalaryNegotiationPage() {
  const crumbs = breadcrumbSchema([
    { name: "Salary Negotiation", path: "/salary-negotiation" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <SalaryNegotiationClient />
      </div>
    </>
  );
}
