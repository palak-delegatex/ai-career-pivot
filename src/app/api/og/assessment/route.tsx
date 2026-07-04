import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type Tier = "building" | "advancing" | "ready";

type TierConfig = {
  background: string;
  accentBar: string;
  ring: string;
  accentText: string;
  badgeBg: string;
  badgeLabel: string;
  subline: string;
};

const TIERS: Record<Tier, TierConfig> = {
  building: {
    background: "linear-gradient(135deg, #0f172a 0%, #1c1917 50%, #451a03 100%)",
    accentBar: "linear-gradient(90deg, #f59e0b, #f97316, #fbbf24)",
    ring: "#f59e0b",
    accentText: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeLabel: "Building Foundation",
    subline: "A strong start — your experience is more transferable than you think.",
  },
  advancing: {
    background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
    accentBar: "linear-gradient(90deg, #14b8a6, #06b6d4, #2dd4bf)",
    ring: "#14b8a6",
    accentText: "#5eead4",
    badgeBg: "rgba(20,184,166,0.12)",
    badgeLabel: "Advancing",
    subline: "You're closer than most — a focused plan could get you there in months.",
  },
  ready: {
    background: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
    accentBar: "linear-gradient(90deg, #10b981, #22c55e, #34d399)",
    ring: "#10b981",
    accentText: "#34d399",
    badgeBg: "rgba(16,185,129,0.12)",
    badgeLabel: "AI-Ready",
    subline: "You're ready to make the leap — your skills already match what employers want.",
  },
};

function getTier(score: number): Tier {
  if (score < 50) return "building";
  if (score < 80) return "advancing";
  return "ready";
}

// Satori (next/og) cannot decode woff2 — request TTF via the Google Fonts CSS
// API using a legacy User-Agent so it returns a truetype `src` url.
async function loadGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}`;
  const css = await fetch(url, {
    headers: {
      // Android 4.1 has no woff2 support → Google serves a truetype `src` url,
      // which is what Satori (next/og) can decode (it cannot decompress woff2).
      "User-Agent":
        "Mozilla/5.0 (Linux; U; Android 4.1; en-us) AppleWebKit/534.30",
    },
  }).then((res) => res.text());

  const src = css.match(/src: url\((.+?)\) format\('(truetype|opentype)'\)/);
  if (!src) {
    throw new Error(`Could not resolve TTF for ${family} ${weight}`);
  }
  return fetch(src[1]).then((res) => res.arrayBuffer());
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawScore = parseInt(searchParams.get("score") || "0", 10);
  const score = Math.max(0, Math.min(100, Number.isNaN(rawScore) ? 0 : rawScore));
  const name = (searchParams.get("name") || "").trim();

  const tier = getTier(score);
  const t = TIERS[tier];

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const [
    inter400,
    inter600,
    inter700,
    inter900,
    serif600,
    serif700,
  ] = await Promise.all([
    loadGoogleFont("Inter", 400),
    loadGoogleFont("Inter", 600),
    loadGoogleFont("Inter", 700),
    loadGoogleFont("Inter", 900),
    loadGoogleFont("Source Serif 4", 600),
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
          background: t.background,
          padding: "64px 80px 56px",
          fontFamily: "Inter",
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
            background: t.accentBar,
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

        {/* Header */}
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
                fontWeight: 900,
              }}
            >
              CP
            </div>
            <span style={{ color: "#94a3b8", fontSize: "20px", fontWeight: 600 }}>
              AICareerPivot
            </span>
          </div>
          <span style={{ color: "#475569", fontSize: "16px", fontWeight: 400 }}>
            ai-career-pivot.com
          </span>
        </div>

        {/* Hero */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "64px",
          }}
        >
          {/* Ring */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              width: "220px",
              height: "220px",
              flexShrink: 0,
            }}
          >
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
              />
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={t.ring}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                transform="rotate(-90 110 110)"
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
              <span style={{ fontSize: "72px", fontWeight: 900 }}>{score}</span>
              <span style={{ fontSize: "36px", fontWeight: 700, opacity: 0.7 }}>%</span>
            </div>
          </div>

          {/* Text block */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "6px 14px",
                borderRadius: "999px",
                background: t.badgeBg,
                color: t.accentText,
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "20px",
              }}
            >
              {t.badgeLabel}
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Source Serif 4",
                fontSize: "48px",
                lineHeight: 1.1,
                marginBottom: "16px",
              }}
            >
              {name ? (
                <span style={{ color: "#f9fafb", fontWeight: 700 }}>
                  <span style={{ color: "#f9fafb", opacity: 0.5, fontWeight: 600 }}>
                    {name}
                    {"'s "}
                  </span>
                  AI-Readiness Score
                </span>
              ) : (
                <span style={{ color: "#f9fafb", fontWeight: 700 }}>
                  Your AI-Readiness Score
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                color: "#94a3b8",
                fontSize: "22px",
                fontWeight: 400,
                lineHeight: 1.4,
                maxWidth: "560px",
              }}
            >
              {t.subline}
            </div>
          </div>
        </div>

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
          <span style={{ color: t.accentText, fontSize: "18px", fontWeight: 600 }}>
            Discover your AI-readiness →
          </span>
          <span style={{ color: "#64748b", fontSize: "16px", fontWeight: 400 }}>
            Free assessment · 3 min
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter600, weight: 600, style: "normal" },
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Inter", data: inter900, weight: 900, style: "normal" },
        { name: "Source Serif 4", data: serif600, weight: 600, style: "normal" },
        { name: "Source Serif 4", data: serif700, weight: 700, style: "normal" },
      ],
    }
  );
}
