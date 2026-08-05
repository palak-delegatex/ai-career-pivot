import { renderLlmsTxt } from "@/lib/llms";

// Prerendered at build time so /llms.txt is a static text file that refreshes
// with the full blog index on every deploy (AIC-1053).
export const dynamic = "force-static";

export function GET() {
  return new Response(renderLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
