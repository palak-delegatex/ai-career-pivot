import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Career Pivot Readiness Check — free score in 60 seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ color: "#64d8cb", fontSize: 24, marginBottom: 28, fontWeight: 600 }}>
          AICareerPivot
        </div>
        <div
          style={{
            color: "white",
            fontSize: 66,
            fontWeight: 900,
            lineHeight: 1.08,
            marginBottom: 28,
            maxWidth: 950,
          }}
        >
          How ready are you to pivot into AI?
        </div>
        <div style={{ color: "#94a3b8", fontSize: 28, lineHeight: 1.5, marginBottom: 40, maxWidth: 900 }}>
          5 questions · an honest 0–100 readiness score · your next 3 moves. No resume, no signup.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#0d9488", fontSize: 24, fontWeight: 700 }}>
            Free self-check — instant result
          </div>
          <div style={{ color: "#64748b", fontSize: 22 }}>ai-career-pivot.com/readiness</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
