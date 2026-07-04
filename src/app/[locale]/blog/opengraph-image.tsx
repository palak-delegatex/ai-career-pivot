import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, localeNames, type Locale } from "@/i18n/routing";
import { fontFamilyFor, loadGoogleFont } from "@/lib/og-fonts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AICareerPivot Blog";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = hasLocale(routing.locales, raw)
    ? raw
    : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: "meta.blogIndex" });
  const eyebrow = localeNames[locale];
  const headline = t("ogHeadline");
  const sub = t("ogSub");

  const family = fontFamilyFor(locale);
  const glyphs = `${eyebrow}${headline}${sub}AICareerPivot CP`;
  const [regular, bold] = await Promise.all([
    loadGoogleFont(family, glyphs, 500),
    loadGoogleFont(family, glyphs, 800),
  ]);

  const fonts = [
    regular && { name: family, data: regular, weight: 500 as const, style: "normal" as const },
    bold && { name: family, data: bold, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: 500 | 800;
    style: "normal";
  }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          padding: "80px",
          fontFamily: family,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
              borderRadius: "12px",
              color: "white",
              fontSize: "22px",
              fontWeight: 800,
            }}
          >
            CP
          </div>
          <span style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: 800 }}>
            AICareerPivot
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#818cf8",
              fontSize: "24px",
              fontWeight: 500,
              letterSpacing: "1px",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: "#f1f5f9",
              fontSize: "60px",
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: "1000px",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "30px",
              fontWeight: 500,
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            {sub}
          </div>
        </div>

        <div style={{ color: "#64748b", fontSize: "22px", fontWeight: 500 }}>
          ai-career-pivot.com/blog
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
