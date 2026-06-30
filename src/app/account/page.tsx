import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "Account — AICareerPivot",
  description: "Manage your account settings and view saved reports.",
};

export default function AccountPage() {
  return (
    <AuthenticatedLayout>
      <AccountClient />
    </AuthenticatedLayout>
  );
}
