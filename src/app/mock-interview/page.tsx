import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import MockInterviewClient from "./MockInterviewClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Mock Interview — AICareerPivot",
  description: "Practice AI-powered mock interviews for your target role. Get real-time feedback and a scorecard.",
  alternates: { canonical: "https://ai-career-pivot.com/mock-interview" },
};

export default function MockInterviewPage() {
  const crumbs = breadcrumbSchema([{ name: "Mock Interview", path: "/mock-interview" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <MockInterviewClient />
      </AuthenticatedLayout>
    </>
  );
}
