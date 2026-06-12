import SiteNav from "@/components/SiteNav";
import NetworkingClient from "./NetworkingClient";

export const metadata = {
  title: "Networking CRM — AICareerPivot",
  description: "Track your professional contacts, follow-ups, and networking relationships.",
};

export default function NetworkingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <NetworkingClient />
    </div>
  );
}
