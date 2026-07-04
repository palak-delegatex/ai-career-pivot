import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Join the AICareerPivot Waitlist";
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
        <div style={{ color: "#64d8cb", fontSize: 24, marginBottom: 32, fontWeight: 600 }}>
          AICareerPivot
        </div>
        <div
          style={{
            color: "white",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 28,
            maxWidth: 900,
          }}
        >
          Join the AICareerPivot Waitlist
        </div>
        <div style={{ color: "#94a3b8", fontSize: 26, lineHeight: 1.5, marginBottom: 16 }}>
          Founding cohort: $49/month, locked forever.
        </div>
        <div style={{ color: "#64748b", fontSize: 22, lineHeight: 1.5, marginBottom: 40 }}>
          Standard price after cohort: $99/month.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#0d9488", fontSize: 22, fontWeight: 700 }}>
            Waitlist is free. Founding price guaranteed.
          </div>
          <div style={{ color: "#64748b", fontSize: 20 }}>ai-career-pivot.com/waitlist</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
