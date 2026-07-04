import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CareerPortfolio from "@/components/CareerPortfolio";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import type { CareerPortfolio as CareerPortfolioType } from "@/lib/portfolio";

interface PortfolioPageProps {
  params: Promise<{ id: string; locale: string }>;
}

// TODO: Replace with Supabase query once portfolio table exists
async function getPortfolio(id: string): Promise<CareerPortfolioType | null> {
  // Placeholder: returns demo data for now
  if (id === "demo") {
    return {
      id: "demo",
      userId: "demo-user",
      displayName: "Sarah K.",
      initials: "SK",
      headline: "Engineer turned Product Lead — building the future of developer tools",
      currentRole: "Senior Engineer",
      targetRole: "Product Lead",
      completionPercent: 78,
      projects: [
        {
          id: "p1",
          title: "Developer Experience Audit",
          description:
            "Led a cross-functional audit of internal developer tools, identifying 12 friction points and proposing a prioritized roadmap that reduced onboarding time by 40%.",
          skills: ["Product Strategy", "User Research", "Data Analysis"],
          completedAt: "Mar 2026",
          url: undefined,
        },
        {
          id: "p2",
          title: "AI-Assisted Code Review Dashboard",
          description:
            "Built a prototype dashboard that surfaces AI-generated code review summaries, reducing review turnaround from 48h to 6h for a team of 8 engineers.",
          skills: ["React", "Python", "LLM Integration", "Prototyping"],
          completedAt: "Jan 2026",
          url: undefined,
        },
      ],
      certifications: [
        {
          id: "c1",
          name: "Product Management Certificate",
          provider: "Product School",
          completedAt: "Feb 2026",
        },
        {
          id: "c2",
          name: "Google Project Management",
          provider: "Coursera / Google",
          completedAt: "Dec 2025",
        },
      ],
      milestones: [
        { id: "m1", title: "Completed skills assessment", phase: "6-month", completedAt: "Oct 2025" },
        { id: "m2", title: "Finished PM certification", phase: "6-month", completedAt: "Feb 2026" },
        { id: "m3", title: "Shipped first product case study", phase: "6-month", completedAt: "Mar 2026" },
        { id: "m4", title: "Secured PM Lead interviews", phase: "1-year", completedAt: "Apr 2026" },
        { id: "m5", title: "Accepted Product Lead offer", phase: "1-year", completedAt: "May 2026" },
      ],
      skills: ["Product Strategy", "User Research", "Roadmapping", "Python", "System Design", "Data Analysis", "Stakeholder Communication", "Agile", "SQL"],
      transferableSkills: ["Technical Communication", "Architecture Trade-offs", "Code Review"],
      badgeKeys: ["first_step", "phase_complete", "streak_master", "halfway_there"],
      createdAt: "2025-09-15",
      updatedAt: "2026-05-20",
      isPublic: true,
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const portfolio = await getPortfolio(id);

  if (!portfolio) {
    return { title: t("metaNotFoundTitle") };
  }

  return {
    title: t("metaTitle", { name: portfolio.displayName }),
    description: t("metaDescription", {
      name: portfolio.displayName,
      currentRole: portfolio.currentRole,
      targetRole: portfolio.targetRole,
      percent: portfolio.completionPercent,
      projects: portfolio.projects.length,
      certifications: portfolio.certifications.length,
    }),
    openGraph: {
      title: t("ogTitle", { name: portfolio.displayName }),
      description: t("ogDescription", {
        currentRole: portfolio.currentRole,
        targetRole: portfolio.targetRole,
        percent: portfolio.completionPercent,
      }),
      type: "profile",
    },
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portfolio");
  const portfolio = await getPortfolio(id);

  if (!portfolio) {
    return (
      <div className="mesh-bg">
        <SiteNav />
        <main className="relative z-10 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-3">
            {t("notFoundHeading")}
          </h1>
          <p className="text-slate-400">{t("notFoundBody")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mesh-bg">
      <SiteNav />
      <main className="relative z-10 pt-24 pb-16 px-6">
        <CareerPortfolio portfolio={portfolio} />
      </main>
      <Footer />
    </div>
  );
}
