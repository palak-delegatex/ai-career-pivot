import localFont from "next/font/local";

// The exported constant must match the custom shared family in Turbopack.
export const Inter = localFont({
  src: [
    { path: "./inter/inter-greek.woff2", weight: "400", style: "normal" },
    { path: "./inter/inter-greek.woff2", weight: "500", style: "normal" },
    { path: "./inter/inter-greek.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Inter Fallback"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+370-377,U+37A-37F,U+384-38A,U+38C,U+38E-3A1,U+3A3-3FF" },
  ],
});
