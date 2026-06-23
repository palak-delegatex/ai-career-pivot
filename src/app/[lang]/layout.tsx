import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { PostHogProvider } from "../PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { HelpProvider } from "@/components/HelpProvider";
import { CareerCoachProvider } from "@/components/CareerCoachContext";
import {
  hasLocale,
  locales,
  localeDirections,
  localeUrl,
  localeToOgLocale,
  type Locale,
} from "@/i18n/config";
import { notFound } from "next/navigation";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const locale = lang as Locale;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localeUrl("/", l);
  }
  languages["x-default"] = localeUrl("/");

  return {
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
      locale: localeToOgLocale[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => localeToOgLocale[l]),
      url: localeUrl("/", locale),
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
      canonical: localeUrl("/", locale),
      languages,
    },
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dir = localeDirections[lang];

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <CareerCoachProvider>
            <div className="flex-1">{children}</div>
            <Footer lang={lang} />
            <HelpProvider />
          </CareerCoachProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
