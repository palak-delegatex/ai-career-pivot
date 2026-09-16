import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Dynamic OG image for the "State of AI Career Pivots 2026" data page and its
// per-stat shares (AIC-1233, design AIC-1234 §4). Params:
//   ?title=State+of+AI+Career+Pivots+2026&stat=170M&label=new+jobs+by+2030

export const runtime = "nodejs";

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
  const title = (searchParams.get("title") || "State of AI Career Pivots 2026").slice(0, 60);
  const stat = (searchParams.get("stat") || "170M").slice(0, 16);
  const label = (searchParams.get("label") || "new jobs projected by 2030").slice(0, 90);

  const [inter400, inter700, serif700, serif900] = await Promise.all([
    loadGoogleFont("Inter", 400),
    loadGoogleFont("Inter", 700),
    loadGoogleFont("Source Serif 4", 700),
    loadGoogleFont("Source Serif 4", 900),
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
          background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
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
            background: "linear-gradient(90deg, #14b8a6, #06b6d4, #2dd4bf)",
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
              fontWeight: 700,
            }}
          >
            CP
          </div>
          <span style={{ color: "#94a3b8", fontSize: "20px", fontWeight: 700 }}>AICareerPivot</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontFamily: "Source Serif 4",
            fontSize: "44px",
            fontWeight: 700,
            color: "#f9fafb",
            lineHeight: 1.1,
            marginTop: "28px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Stat callout card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              background: "rgba(2,6,23,0.55)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: "24px",
              padding: "40px 48px",
            }}
          >
            <span
              style={{
                fontFamily: "Source Serif 4",
                fontSize: "104px",
                fontWeight: 900,
                color: "#5eead4",
                lineHeight: 1,
              }}
            >
              {stat}
            </span>
            <span
              style={{
                display: "flex",
                fontSize: "30px",
                color: "#e2e8f0",
                lineHeight: 1.35,
                maxWidth: "480px",
              }}
            >
              {label}
            </span>
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
          <span style={{ color: "#5eead4", fontSize: "18px", fontWeight: 700 }}>
            See all stats →
          </span>
          <span style={{ color: "#64748b", fontSize: "16px" }}>
            ai-career-pivot.com/research
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
        { name: "Source Serif 4", data: serif700, weight: 700, style: "normal" },
        { name: "Source Serif 4", data: serif900, weight: 900, style: "normal" },
      ],
    },
  );
}
