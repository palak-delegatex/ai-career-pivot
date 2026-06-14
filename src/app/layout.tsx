import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <PostHogProvider>
            <div className="flex-1">{children}</div>
            <Footer />
          </PostHogProvider>
          <Analytics />
        </body>
    </html>
  );
}
