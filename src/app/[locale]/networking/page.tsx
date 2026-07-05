import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import { getTranslations, setRequestLocale } from "next-intl/server";
import NetworkingClient from "./NetworkingClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "networking" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: alternatesFor("/networking", locale),
  };
}

export default async function NetworkingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("networking");
  const crumbs = breadcrumbSchema([{ name: t("page.breadcrumb"), path: "/networking" }]);
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
