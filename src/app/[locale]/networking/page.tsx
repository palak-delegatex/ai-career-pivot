import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import NetworkingClient from "./NetworkingClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "networking" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: { canonical: "https://ai-career-pivot.com/networking" },
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
      <AuthenticatedLayout>
        <NetworkingClient />
      </AuthenticatedLayout>
    </>
  );
}
