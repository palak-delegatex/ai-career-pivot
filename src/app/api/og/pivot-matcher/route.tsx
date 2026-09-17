import { ImageResponse } from "next/og";

// Static OG image for /pivot-matcher (AIC-1240). Mirrors the /readiness card
// style (dark teal gradient, dotted texture, CP badge) so the discovery tools
// share one visual identity.

export const runtime = "nodejs";

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

const ROLES = [
  "Data Scientist / Analyst",
  "AI Product Manager",
  "ML Engineer",
  "AI Program Manager",
];

export async function GET() {
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
              fontWeight: 900,
            }}
          >
            CP
          </div>
          <span style={{ color: "#94a3b8", fontSize: "20px", fontWeight: 700 }}>AICareerPivot</span>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <span
            style={{
              fontFamily: "Source Serif 4",
              fontSize: "60px",
              fontWeight: 700,
              color: "#f9fafb",
              lineHeight: 1.1,
              maxWidth: "860px",
            }}
          >
            Which AI-adjacent role fits you best?
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "28px", maxWidth: "900px" }}>
            {ROLES.map((r, i) => (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  background: "rgba(20,184,166,0.10)",
                  border: "1px solid rgba(20,184,166,0.35)",
                  color: "#5eead4",
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "18px" }}>{i + 1}</span>
                {r}
              </div>
            ))}
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
            Get your ranked matches free →
          </span>
          <span style={{ color: "#64748b", fontSize: "16px" }}>
            ai-career-pivot.com/pivot-matcher
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
