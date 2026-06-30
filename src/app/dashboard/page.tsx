import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Your Roadmaps — AICareerPivot",
  description: "View your saved career pivot roadmaps and next actions.",
};

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <DashboardClient />
    </AuthenticatedLayout>
  );
}
