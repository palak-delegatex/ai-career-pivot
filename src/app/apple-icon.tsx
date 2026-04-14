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
          background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
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
              fontSize: "80px",
              fontWeight: "900",
              letterSpacing: "-4px",
              lineHeight: 1,
            }}
          >
            CP
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "600",
              letterSpacing: "2px",
              marginTop: "6px",
              opacity: 0.85,
            }}
          >
            PIVOT
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
