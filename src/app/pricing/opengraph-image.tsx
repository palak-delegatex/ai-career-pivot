import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pricing — AICareerPivot";
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
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          $49/month vs $250/hour
        </div>
        <div style={{ color: "#94a3b8", fontSize: 28, lineHeight: 1.4, marginBottom: 40 }}>
          Career coaching that actually reads your background.
          <br />
          Founding cohort pricing. Limited to 100 users.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#0d9488",
              color: "white",
              fontSize: 18,
              fontWeight: 700,
              padding: "10px 24px",
              borderRadius: 8,
            }}
          >
            Join Founding Cohort →
          </div>
          <div style={{ color: "#64748b", fontSize: 20 }}>ai-career-pivot.com/pricing</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
