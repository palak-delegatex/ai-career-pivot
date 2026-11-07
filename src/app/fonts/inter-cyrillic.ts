import localFont from "next/font/local";

// The exported constant must match the custom shared family in Turbopack.
export const Inter = localFont({
  src: [
    { path: "./inter/inter-cyrillic.woff2", weight: "400", style: "normal" },
    { path: "./inter/inter-cyrillic.woff2", weight: "500", style: "normal" },
    { path: "./inter/inter-cyrillic.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Inter Fallback"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+301,U+400-45F,U+490-491,U+4B0-4B1,U+2116" },
  ],
});
