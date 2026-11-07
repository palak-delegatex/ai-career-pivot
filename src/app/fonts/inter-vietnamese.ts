import localFont from "next/font/local";

// The exported constant must match the custom shared family in Turbopack.
export const Inter = localFont({
  src: [
    { path: "./inter/inter-vietnamese.woff2", weight: "400", style: "normal" },
    { path: "./inter/inter-vietnamese.woff2", weight: "500", style: "normal" },
    { path: "./inter/inter-vietnamese.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Inter Fallback"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+102-103,U+110-111,U+128-129,U+168-169,U+1A0-1A1,U+1AF-1B0,U+300-301,U+303-304,U+308-309,U+323,U+329,U+1EA0-1EF9,U+20AB" },
  ],
});
