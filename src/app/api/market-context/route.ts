import { NextRequest, NextResponse } from "next/server";
import { fetchMarketContext } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  const { role, location }: { role: string; location?: string } = await req.json();

  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "role (string) required" }, { status: 400 });
  }

  const context = await fetchMarketContext(role);

  if (!context) {
    return NextResponse.json(
      { error: `No market data available for role: ${role}` },
      { status: 404 }
    );
  }

  if (location) {
    const lower = location.toLowerCase();
    const matched = context.geographicHotspots.find(
      (h) =>
        h.metro.toLowerCase().includes(lower) ||
        h.state.toLowerCase() === lower ||
        lower.includes(h.state.toLowerCase())
    );
    if (matched) {
      context.salary.p50 = matched.salaryMedian;
      context.salary.p75 = matched.salaryP75;
      context.salary.p25 = Math.round(matched.salaryMedian * 0.78);
    }
  }

  return NextResponse.json(
    { marketContext: context },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
  );
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const location = req.nextUrl.searchParams.get("location");

  if (!role) {
    return NextResponse.json({ error: "role query parameter required" }, { status: 400 });
  }

  const context = await fetchMarketContext(role);

  if (!context) {
    return NextResponse.json(
      { error: `No market data available for role: ${role}` },
      { status: 404 }
    );
  }

  if (location) {
    const lower = location.toLowerCase();
    const matched = context.geographicHotspots.find(
      (h) =>
        h.metro.toLowerCase().includes(lower) ||
        h.state.toLowerCase() === lower ||
        lower.includes(h.state.toLowerCase())
    );
    if (matched) {
      context.salary.p50 = matched.salaryMedian;
      context.salary.p75 = matched.salaryP75;
      context.salary.p25 = Math.round(matched.salaryMedian * 0.78);
    }
  }

  return NextResponse.json(
    { marketContext: context },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
  );
}
