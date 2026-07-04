import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";
import { fontFamilyFor, loadGoogleFont } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  const title = post?.title ?? "AICareerPivot Blog";

  // Truncate to roughly 2 lines (90 chars)
  const truncated = title.length > 90 ? title.slice(0, 87) + "…" : title;

  // Localized titles (hi/ja) need a script-covering font or they render as
  // tofu; fetch a subset covering the title + static labels (AIC-665).
  const family = fontFamilyFor(locale);
  const glyphs = `${truncated}AICareerPivot Blog By Team ai-career-pivot.com/`;
  const [regular, bold] = await Promise.all([
    loadGoogleFont(family, glyphs, 400),
    loadGoogleFont(family, glyphs, 800),
  ]);
  const fonts = [
    regular && { name: family, data: regular, weight: 400 as const, style: "normal" as const },
    bold && { name: family, data: bold, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 800;
    style: "normal";
  }[];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1923",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: family,
        }}
      >
        <div
          style={{
            color: "#0d9488",
            fontSize: 18,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 32,
          }}
        >
          AICareerPivot Blog
        </div>
        <div
          style={{
            color: "white",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 40,
            maxWidth: 1000,
          }}
        >
          {truncated}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 20 }}>By AICareerPivot Team</div>
          <div style={{ color: "#64748b", fontSize: 20 }}>ai-career-pivot.com/blog</div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
