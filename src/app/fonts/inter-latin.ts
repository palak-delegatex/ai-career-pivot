import localFont from "next/font/local";

// The exported constant must match the custom shared family in Turbopack.
export const Inter = localFont({
  src: [
    { path: "./inter/inter-latin.woff2", weight: "400", style: "normal" },
    { path: "./inter/inter-latin.woff2", weight: "500", style: "normal" },
    { path: "./inter/inter-latin.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Inter Fallback"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+??,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" },
  ],
});
