import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
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
      <AuthenticatedLayout>
        <NetworkingClient />
      </AuthenticatedLayout>
    </>
  );
}
