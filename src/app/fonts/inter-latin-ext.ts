import localFont from "next/font/local";

// The exported constant must match the custom shared family in Turbopack.
export const Inter = localFont({
  src: [
    { path: "./inter/inter-latin-ext.woff2", weight: "400", style: "normal" },
    { path: "./inter/inter-latin-ext.woff2", weight: "500", style: "normal" },
    { path: "./inter/inter-latin-ext.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Inter Fallback"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF" },
  ],
});
