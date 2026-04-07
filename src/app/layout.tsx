import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AICareerPivot — Your Personal Career Strategist",
  description:
    "Stop feeling trapped. Build a personalized career transition roadmap based on your skills, finances, and family constraints. Actionable 6-month, 1-year, and 2-year plans.",
  openGraph: {
    title: "AICareerPivot — Your Personal Career Strategist",
    description:
      "Stop feeling trapped. Build a personalized career transition roadmap based on your skills, finances, and family constraints.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
