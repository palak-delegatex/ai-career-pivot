import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const role = searchParams.get("role") || "";
  const targetRole = searchParams.get("targetRole") || "";
  const progress = parseInt(searchParams.get("progress") || "0", 10);
  const milestones = parseInt(searchParams.get("milestones") || "0", 10);
  const totalMilestones = parseInt(searchParams.get("totalMilestones") || "0", 10);
  const streak = parseInt(searchParams.get("streak") || "0", 10);
  const badges = parseInt(searchParams.get("badges") || "0", 10);

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (progress / 100) * circumference;

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

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, gap: "60px", alignItems: "center" }}>
          {/* Progress ring */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              width: "200px",
              height: "200px",
              flexShrink: 0,
            }}
          >
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#0d9488"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#f1f5f9", fontSize: "48px", fontWeight: "900" }}>
                {progress}%
              </span>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ color: "#5eead4", fontSize: "16px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
              Career Pivot Progress
            </div>

            {/* Role transition */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <span style={{ color: "#94a3b8", fontSize: "26px" }}>{role}</span>
              <span style={{ color: "#2dd4bf", fontSize: "26px" }}>&rarr;</span>
              <span style={{ color: "#f1f5f9", fontSize: "26px", fontWeight: "800" }}>{targetRole}</span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "24px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "16px 28px",
                }}
              >
                <span style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800" }}>
                  {milestones}/{totalMilestones}
                </span>
                <span style={{ color: "#64748b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Milestones
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "16px 28px",
                }}
              >
                <span style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800" }}>
                  {streak}
                </span>
                <span style={{ color: "#64748b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Day Streak
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "16px 28px",
                }}
              >
                <span style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800" }}>
                  {badges}
                </span>
                <span style={{ color: "#64748b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Badges
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
