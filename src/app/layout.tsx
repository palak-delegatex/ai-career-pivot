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
    default: "AI Career Pivot — Your Personalized Career Transition Roadmap",
    template: "%s | AI Career Pivot",
  },
  description:
    "Get your personalized career transition roadmap for $9 early access. AI Career Pivot analyzes your skills, finances, and family constraints to build actionable 6-month, 1-year, and 2-year plans.",
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
  authors: [{ name: "AI Career Pivot", url: BASE_URL }],
  creator: "AI Career Pivot",
  publisher: "AI Career Pivot",
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
    siteName: "AI Career Pivot",
    title: "AI Career Pivot — Your Personalized Career Transition Roadmap",
    description:
      "Get your personalized career transition roadmap for $9 early access. Analyzes your skills, finances, and family constraints to build actionable plans.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Career Pivot — Personalized career transition roadmaps powered by AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Career Pivot — Your Personalized Career Transition Roadmap",
    description:
      "Get your personalized career transition roadmap for $9 early access. Built around your skills, finances, and family constraints.",
    creator: "@aicareer_pivot",
    images: ["/opengraph-image"],
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
