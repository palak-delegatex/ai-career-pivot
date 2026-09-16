import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Dynamic OG image for the /readiness result (AIC-1233, design AIC-1200 §1.6).
// Params: ?score=74&tier=strong-foundation. With no score, renders the generic
// "take the assessment" invite used as the base page's share card.

export const runtime = "nodejs";

type TierSlug = "ready-to-pivot" | "strong-foundation" | "building-momentum" | "exploring";

type TierConfig = {
  background: string;
  accentBar: string;
  ring: string;
  accentText: string;
  label: string;
  quote: string;
};

const TIERS: Record<TierSlug, TierConfig> = {
  "ready-to-pivot": {
    background: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
    accentBar: "linear-gradient(90deg, #10b981, #22c55e, #34d399)",
    ring: "#10b981",
    accentText: "#34d399",
    label: "Ready to Pivot",
    quote: "You're ready to pivot into an AI career.",
  },
  "strong-foundation": {
    background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
    accentBar: "linear-gradient(90deg, #14b8a6, #06b6d4, #2dd4bf)",
    ring: "#14b8a6",
    accentText: "#5eead4",
    label: "Strong Foundation",
    quote: "You have a strong foundation for an AI career pivot.",
  },
  "building-momentum": {
    background: "linear-gradient(135deg, #0f172a 0%, #451a03 100%)",
    accentBar: "linear-gradient(90deg, #f59e0b, #f97316, #fbbf24)",
    ring: "#f59e0b",
    accentText: "#fbbf24",
    label: "Building Momentum",
    quote: "You're building real momentum toward an AI career.",
  },
  exploring: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accentBar: "linear-gradient(90deg, #64748b, #94a3b8, #cbd5e1)",
    ring: "#94a3b8",
    accentText: "#cbd5e1",
    label: "Exploring",
    quote: "You're early in exploring an AI career pivot.",
  },
};

function tierFromScore(score: number): TierSlug {
  if (score >= 80) return "ready-to-pivot";
  if (score >= 60) return "strong-foundation";
  if (score >= 40) return "building-momentum";
  return "exploring";
}

// Satori (next/og) cannot decode woff2 — request TTF via the Google Fonts CSS
// API using a legacy User-Agent so it returns a truetype `src` url.
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; U; Android 4.1; en-us) AppleWebKit/534.30",
    },
  }).then((res) => res.text());
  const src = css.match(/src: url\((.+?)\) format\('(truetype|opentype)'\)/);
  if (!src) throw new Error(`Could not resolve TTF for ${family} ${weight}`);
  return fetch(src[1]).then((res) => res.arrayBuffer());
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const hasScore = searchParams.has("score");
  const rawScore = parseInt(searchParams.get("score") || "0", 10);
  const score = Math.max(0, Math.min(100, Number.isNaN(rawScore) ? 0 : rawScore));

  const tierParam = searchParams.get("tier") as TierSlug | null;
  const tierSlug: TierSlug =
    tierParam && tierParam in TIERS ? tierParam : tierFromScore(score);
  const t = TIERS[tierSlug];

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const [inter400, inter700, inter900, serif700] = await Promise.all([
    loadGoogleFont("Inter", 400),
    loadGoogleFont("Inter", 700),
    loadGoogleFont("Inter", 900),
    loadGoogleFont("Source Serif 4", 700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: hasScore ? t.background : "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
          padding: "64px 80px 56px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: t.accentBar,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Header */}
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
              fontWeight: 900,
            }}
          >
            CP
          </div>
          <span style={{ color: "#94a3b8", fontSize: "20px", fontWeight: 700 }}>AICareerPivot</span>
        </div>

        {/* Body */}
        {hasScore ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "56px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "212px",
                height: "212px",
                flexShrink: 0,
              }}
            >
              <svg width="212" height="212" viewBox="0 0 212 212">
                <circle cx="106" cy="106" r={radius} fill="none" stroke="#1e293b" strokeWidth="14" />
                <circle
                  cx="106"
                  cy="106"
                  r={radius}
                  fill="none"
                  stroke={t.ring}
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
                  color: t.accentText,
                }}
              >
                <span style={{ fontSize: "68px", fontWeight: 900 }}>{score}</span>
                <span style={{ fontSize: "34px", fontWeight: 700, opacity: 0.7 }}>%</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span
                style={{
                  fontFamily: "Source Serif 4",
                  fontSize: "26px",
                  color: "#94a3b8",
                  marginBottom: "6px",
                }}
              >
                AI Career Pivot Readiness
              </span>
              <span
                style={{
                  fontFamily: "Source Serif 4",
                  fontSize: "52px",
                  fontWeight: 700,
                  color: "#f9fafb",
                  lineHeight: 1.1,
                  marginBottom: "16px",
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  fontSize: "24px",
                  color: "#cbd5e1",
                  lineHeight: 1.4,
                  maxWidth: "540px",
                }}
              >
                {t.quote}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Source Serif 4",
                fontSize: "64px",
                fontWeight: 700,
                color: "#f9fafb",
                lineHeight: 1.1,
                maxWidth: "820px",
              }}
            >
              How ready are you for an AI career pivot?
            </span>
            <span style={{ fontSize: "28px", color: "#5eead4", marginTop: "24px" }}>
              5 questions · 60 seconds · instant results · no signup
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <span style={{ color: t.accentText, fontSize: "18px", fontWeight: 700 }}>
            Take the free assessment →
          </span>
          <span style={{ color: "#64748b", fontSize: "16px" }}>
            ai-career-pivot.com/readiness
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Inter", data: inter900, weight: 900, style: "normal" },
        { name: "Source Serif 4", data: serif700, weight: 700, style: "normal" },
      ],
    },
  );
}
