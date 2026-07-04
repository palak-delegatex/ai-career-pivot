import type { Metadata } from "next";
import WaitlistForm from "./WaitlistForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("waitlist");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://ai-career-pivot.com/waitlist",
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://ai-career-pivot.com/waitlist",
    },
  };
}

export default function WaitlistPage() {
  return <WaitlistForm />;
}
