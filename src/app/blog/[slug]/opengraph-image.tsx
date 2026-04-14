import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "AICareerPivot Blog";

  // Truncate to roughly 2 lines (90 chars)
  const truncated = title.length > 90 ? title.slice(0, 87) + "…" : title;

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
        <div
          style={{
            color: "#0d9488",
            fontSize: 18,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 32,
          }}
        >
          AICareerPivot Blog
        </div>
        <div
          style={{
            color: "white",
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 40,
            maxWidth: 1000,
          }}
        >
          {truncated}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 20 }}>By AICareerPivot Team</div>
          <div style={{ color: "#64748b", fontSize: 20 }}>ai-career-pivot.com/blog</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
