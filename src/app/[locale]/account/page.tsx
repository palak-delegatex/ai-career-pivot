import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import AccountClient from "./AccountClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AccountPage() {
  return (
    <AuthenticatedLayout>
      <AccountClient />
    </AuthenticatedLayout>
  );
}
