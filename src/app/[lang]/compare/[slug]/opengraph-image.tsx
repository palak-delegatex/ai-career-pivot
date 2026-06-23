import { ImageResponse } from "next/og";

export const alt = "AICareerPivot vs Competitors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

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
            marginBottom: 24,
          }}
        >
          AICareerPivot vs {name}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 28, lineHeight: 1.4, marginBottom: 40 }}>
          Side-by-side comparison of features, pricing, and methodology
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#0d9488", fontSize: 22, fontWeight: 700 }}>Honest comparison</div>
          <div style={{ color: "#64748b", fontSize: 20 }}>
            ai-career-pivot.com/compare/{slug}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
