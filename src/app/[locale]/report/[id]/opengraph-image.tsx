import { ImageResponse } from "next/og";
import { getSupabaseClient } from "@/lib/supabase";
import type { PivotPlan } from "@/lib/intake";
import { fontFamilyFor, loadGoogleFont } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Tiered treatment keyed off the match score, mirroring the standalone
// assessment card (src/app/api/og/assessment/route.tsx) so both share loops
// speak the same brand language. Higher score → greener, more confident.
type TierKey = "building" | "advancing" | "ready";
type Tier = {
  background: string;
  accentBar: string;
  ring: string;
  accentText: string;
  badgeBg: string;
  label: string;
};
const TIERS: Record<TierKey, Tier> = {
  building: {
    background: "linear-gradient(135deg, #0f172a 0%, #1c1917 55%, #451a03 100%)",
    accentBar: "linear-gradient(90deg, #f59e0b, #f97316, #fbbf24)",
    ring: "#f59e0b",
    accentText: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.12)",
    label: "Emerging match",
  },
  advancing: {
    background: "linear-gradient(135deg, #0f1923 0%, #134e4a 100%)",
    accentBar: "linear-gradient(90deg, #14b8a6, #06b6d4, #2dd4bf)",
    ring: "#14b8a6",
    accentText: "#5eead4",
    badgeBg: "rgba(20,184,166,0.12)",
    label: "Strong match",
  },
  ready: {
    background: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
    accentBar: "linear-gradient(90deg, #10b981, #22c55e, #34d399)",
    ring: "#10b981",
    accentText: "#34d399",
    badgeBg: "rgba(16,185,129,0.12)",
    label: "Excellent match",
  },
};
function tierFor(score: number): TierKey {
  if (score < 50) return "building";
  if (score < 80) return "advancing";
  return "ready";
}

// Shareable result card for the assessment share loop (AIC-688 Scope 2). Shows
// the user's best career-pivot match score + target role — NO name or other
// PII, so a report link is safe to share publicly. The report id is the only
// key.
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

  const hasScore = score !== null;
  const tier = TIERS[hasScore ? tierFor(score as number) : "advancing"];
  const roleClipped = role.length > 34 ? role.slice(0, 33) + "…" : role;
  const headline = hasScore && roleClipped ? roleClipped : "My career pivot plan";
  const badge = hasScore ? tier.label : "Career pivot plan";
  const subline = "AI-mapped from my skills, values & finances";

  // Progress-ring geometry (only drawn when we have a score).
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (score ?? 0) / 100);

  const family = fontFamilyFor(locale);
  const glyphs =
    `${headline}${badge}${subline}${TIERS.building.label}${TIERS.advancing.label}` +
    `${TIERS.ready.label}Career pivot planAICareerPivotCPBest-fit roleBuild your pivot plan ` +
    `Find your match ai-career-pivot.com Free AI-mapped in min →·'%0123456789`;
  const [regular, semibold, bold] = await Promise.all([
    loadGoogleFont(family, glyphs, 400),
    loadGoogleFont(family, glyphs, 700),
    loadGoogleFont(family, glyphs, 800),
  ]);
  const fonts = [
    regular && { name: family, data: regular, weight: 400 as const, style: "normal" as const },
    semibold && { name: family, data: semibold, weight: 700 as const, style: "normal" as const },
    bold && { name: family, data: bold, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700 | 800;
    style: "normal";
  }[];

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: tier.background,
          padding: "64px 80px 56px",
          fontFamily: family,
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: tier.accentBar,
          }}
        />

        {/* Dot-grid texture */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Header: logo mark + wordmark / domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
                borderRadius: "10px",
                color: "white",
                fontSize: "17px",
                fontWeight: 800,
              }}
            >
              CP
            </div>
            <span style={{ color: "#94a3b8", fontSize: "22px", fontWeight: 700 }}>
              AICareerPivot
            </span>
          </div>
          <span style={{ color: "#475569", fontSize: "18px", fontWeight: 400 }}>
            ai-career-pivot.com
          </span>
        </div>

        {/* Hero: score ring + text block */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "56px" }}>
          {hasScore && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: "212px",
                height: "212px",
                flexShrink: 0,
              }}
            >
              <svg width="212" height="212" viewBox="0 0 212 212">
                <circle
                  cx="106"
                  cy="106"
                  r={radius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="14"
                />
                <circle
                  cx="106"
                  cy="106"
                  r={radius}
                  fill="none"
                  stroke={tier.ring}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${offset}`}
                  transform="rotate(-90 106 106)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "baseline",
                  color: tier.accentText,
                }}
              >
                <span style={{ fontSize: "78px", fontWeight: 800 }}>{score}</span>
                <span style={{ fontSize: "38px", fontWeight: 700, opacity: 0.7 }}>%</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "7px 16px",
                borderRadius: "999px",
                background: tier.badgeBg,
                color: tier.accentText,
                fontSize: "15px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "22px",
              }}
            >
              {badge}
            </div>
            {hasScore && roleClipped && (
              <div
                style={{
                  color: "#64748b",
                  fontSize: "24px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "10px",
                }}
              >
                Best-fit role
              </div>
            )}
            <div
              style={{
                color: "white",
                fontSize: hasScore && roleClipped ? 82 : 88,
                fontWeight: 800,
                lineHeight: 1.02,
                marginBottom: "22px",
                maxWidth: hasScore ? 780 : 1040,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "26px",
                fontWeight: 400,
                lineHeight: 1.4,
                maxWidth: hasScore ? 780 : 1040,
              }}
            >
              {subline}
            </div>
          </div>
        </div>

        {/* Footer: CTA + reassurance */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <span style={{ color: tier.accentText, fontSize: "22px", fontWeight: 700 }}>
            Find your match →
          </span>
          <span style={{ color: "#64748b", fontSize: "18px", fontWeight: 400 }}>
            Free · AI-mapped in 3 min
          </span>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
