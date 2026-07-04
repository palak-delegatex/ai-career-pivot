import type { Metadata } from "next";
import {
  Inter,
  Source_Serif_4,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_JP,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { PostHogProvider } from "./PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { routing } from "@/i18n/routing";

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

// Script fonts for multilingual support (AIC-662). Not preloaded — the browser
// only fetches them when Devanagari (Hindi) or CJK (Japanese) glyphs render.
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const notoJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
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

// Pre-render a route tree for every supported locale at build time (AIC-667).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Reject unknown locales instead of rendering an empty/default catalog.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opt this layout (and everything below it) into static rendering for `locale`.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} ${notoDevanagari.variable} ${notoJP.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <PostHogProvider>
            <div className="flex-1">{children}</div>
            <Footer />
          </PostHogProvider>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
