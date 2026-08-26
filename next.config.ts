import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Wires the per-request i18n config (AIC-662). Points at the request module
// so Server Components can resolve messages for the active locale.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  // Mobile-perf: tree-shake framer-motion's barrel export (AIC-1100). The home
  // route ships `motion`, `useInView`, `useSpring`, `useTransform`, etc. across
  // HomeClient + several section components; without this, importing from the
  // package root pulls a large slice of the library into the home route's First
  // Load JS, inflating Total Blocking Time on mobile. optimizePackageImports
  // rewrites the barrel imports to load only the used modules — pure bundle
  // reduction, no behavior change. framer-motion is not optimized by default.
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Image optimization tuned for entry-page LCP (AIC-1067). The home hero is a
  // full-viewport decorative PNG and is the LCP element on `/` (field p50 ~3.3s,
  // p75 ~4.1s — poor). Two levers:
  //   1. formats: serve AVIF first (≈20% smaller than the WebP-only default),
  //      WebP fallback for browsers without AVIF support.
  //   2. qualities: Next 16 requires non-75 quality values to be allowlisted
  //      (unrestricted quality access is now a build error). 50 lets the darkened
  //      decorative hero ship far fewer bytes without visible loss under its 80%
  //      overlay; 75 stays available for content images (dashboard/product shots).
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
