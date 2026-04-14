import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "AICareerPivot — Personalized career transition roadmaps powered by AI";

export default function OgImage() {
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
          background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
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
              fontWeight: "900",
              letterSpacing: "-1px",
            }}
          >
            CP
          </div>
          <span
            style={{
              color: "#f1f5f9",
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
          >
            AICareerPivot
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              color: "#5eead4",
              fontSize: "22px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
          >
            Your Personal Career Strategist
          </div>
          <div
            style={{
              color: "#f1f5f9",
              fontSize: "64px",
              fontWeight: "900",
              lineHeight: 1.1,
              letterSpacing: "-2px",
              maxWidth: "900px",
            }}
          >
            Stop feeling trapped. Start your pivot.
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "28px",
              maxWidth: "760px",
              lineHeight: 1.4,
            }}
          >
            Personalized roadmaps built around your skills, finances, and family
            — not generic advice.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            color: "#64748b",
            fontSize: "20px",
          }}
        >
          <span>6-month plan</span>
          <span style={{ color: "#0d9488" }}>→</span>
          <span>1-year plan</span>
          <span style={{ color: "#0d9488" }}>→</span>
          <span>2-year plan</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
