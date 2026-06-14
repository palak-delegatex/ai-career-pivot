import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "Your";
  const role = searchParams.get("role") || "";

  const pathsRaw = searchParams.get("paths");
  let paths: { role: string; match: number }[] = [];
  if (pathsRaw) {
    try {
      paths = JSON.parse(decodeURIComponent(pathsRaw));
    } catch {}
  }

  const strengthsRaw = searchParams.get("strengths");
  let strengths: string[] = [];
  if (strengthsRaw) {
    try {
      strengths = JSON.parse(decodeURIComponent(strengthsRaw));
    } catch {}
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
              borderRadius: "10px",
              color: "white",
              fontSize: "18px",
              fontWeight: "900",
            }}
          >
            CP
          </div>
          <span style={{ color: "#94a3b8", fontSize: "22px", fontWeight: "600" }}>
            AICareerPivot
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
          <div style={{ color: "#5eead4", fontSize: "18px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px" }}>
            Career Snapshot
          </div>
          <div style={{ color: "#f1f5f9", fontSize: "44px", fontWeight: "900", lineHeight: 1.15, letterSpacing: "-1.5px" }}>
            {name}&apos;s Career Map
          </div>
          {role && (
            <div style={{ color: "#94a3b8", fontSize: "24px" }}>
              Currently: {role}
            </div>
          )}
        </div>

        {/* Path cards */}
        <div style={{ display: "flex", gap: "20px", flex: 1 }}>
          {paths.slice(0, 3).map((p, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: i === 0 ? "rgba(13, 148, 136, 0.15)" : "rgba(15, 23, 42, 0.8)",
                border: i === 0 ? "2px solid #0d9488" : "1px solid #1e293b",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "#f1f5f9", fontSize: "22px", fontWeight: "700", marginBottom: "12px", lineHeight: 1.2 }}>
                  {p.role}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: i === 0 ? "#0d9488" : "#1e293b",
                  borderRadius: "99px",
                  padding: "8px 0",
                }}
              >
                <span style={{ color: "#f9fafb", fontSize: "20px", fontWeight: "800" }}>
                  {p.match}% match
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths footer */}
        {strengths.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
            <span style={{ color: "#64748b", fontSize: "16px" }}>Top strengths:</span>
            {strengths.slice(0, 3).map((s, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(13, 148, 136, 0.2)",
                  border: "1px solid rgba(13, 148, 136, 0.4)",
                  color: "#2dd4bf",
                  fontSize: "15px",
                  fontWeight: "600",
                  padding: "6px 16px",
                  borderRadius: "99px",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
