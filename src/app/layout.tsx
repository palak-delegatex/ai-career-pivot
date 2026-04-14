import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://ai-career-pivot.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AICareerPivot — Your Personal Career Strategist",
    template: "%s | AICareerPivot",
  },
  description:
    "Stop feeling trapped. Build a personalized career transition roadmap based on your skills, finances, and family constraints. Actionable 6-month, 1-year, and 2-year plans.",
  keywords: [
    "career pivot",
    "career change",
    "career transition",
    "career roadmap",
    "AI career advice",
    "career planning",
    "job change",
    "career strategy",
  ],
  authors: [{ name: "AICareerPivot", url: BASE_URL }],
  creator: "AICareerPivot",
  publisher: "AICareerPivot",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AICareerPivot",
    title: "AICareerPivot — Your Personal Career Strategist",
    description:
      "Stop feeling trapped. Build a personalized career transition roadmap based on your skills, finances, and family constraints. Actionable 6-month, 1-year, and 2-year plans.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AICareerPivot — Your Personal Career Strategist",
    description:
      "Stop feeling trapped. Build a personalized career transition roadmap based on your skills, finances, and family constraints.",
    creator: "@aicareer_pivot",
  },
  alternates: {
    canonical: BASE_URL,
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
      <body className="min-h-full flex flex-col">
          <PostHogProvider>{children}</PostHogProvider>
        </body>
    </html>
  );
}
