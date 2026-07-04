import { ImageResponse } from "next/og";
import { getSupabaseClient } from "@/lib/supabase";
import type { PivotPlan } from "@/lib/intake";
import { fontFamilyFor, loadGoogleFont } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Shareable result card for the assessment share loop (AIC-688). Shows the
// user's best career-pivot match score + target role — NO name or other PII,
// so a report link is safe to share publicly. The report id is the only key.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let score: number | null = null;
  let role = "";
  try {
    const supabase = getSupabaseClient();
    const { data: report } = await supabase
      .from("reports")
      .select("plans")
      .eq("id", id)
      .single();
    const plans = (report?.plans as PivotPlan[] | undefined) ?? [];
    const best = plans
      .filter((p) => typeof p.matchScore === "number")
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0];
    if (best) {
      score = Math.round(best.matchScore ?? 0);
      role = best.targetRole ?? "";
    }
  } catch {
    // Fall through to the generic card below.
  }

  const headline = score !== null ? `${score}% match` : "My career pivot plan";
  const sub =
    score !== null && role
      ? `for ${role}`
      : "AI-mapped from my skills, values & finances";
  const roleClipped = sub.length > 60 ? sub.slice(0, 57) + "…" : sub;

  const family = fontFamilyFor(locale);
  const glyphs = `${headline}${roleClipped}AICareerPivot Find your match ai-career-pivot.com/%0123456789`;
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
          background: "linear-gradient(135deg, #0f1923 0%, #042f2e 100%)",
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
            color: "#2dd4bf",
            fontSize: 22,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 28,
          }}
        >
          AICareerPivot
        </div>
        <div
          style={{
            color: "white",
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 40,
            fontWeight: 400,
            marginBottom: 48,
            maxWidth: 1040,
          }}
        >
          {roleClipped}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#2dd4bf", fontSize: 26, fontWeight: 800 }}>
            Find your match →
          </div>
          <div style={{ color: "#64748b", fontSize: 24 }}>ai-career-pivot.com</div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
