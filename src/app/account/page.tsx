import SiteNav from "@/components/SiteNav";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "Account — AICareerPivot",
  description: "Manage your account settings and view saved reports.",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <AccountClient />
    </div>
  );
}
