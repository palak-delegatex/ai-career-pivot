import { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to access your career pivot roadmaps.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <LoginClient />
    </div>
  );
}
