import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
          borderRadius: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: "900",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            ACP
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              letterSpacing: "3px",
              marginTop: "8px",
              opacity: 0.8,
            }}
          >
            AI PIVOT
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
