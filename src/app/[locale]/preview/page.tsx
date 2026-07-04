import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteNav from "@/components/SiteNav";
import PreviewClient from "./PreviewClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "preview" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <PreviewClient />
    </div>
  );
}
