import { NextRequest, NextResponse } from "next/server";
import { fetchMarketData } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  const { roles }: { roles: string[] } = await req.json();

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json({ error: "roles array required" }, { status: 400 });
  }

  const results = await Promise.all(
    roles.slice(0, 5).map(async (role) => ({
      role,
      data: await fetchMarketData(role),
    }))
  );

  const marketData: Record<string, NonNullable<Awaited<ReturnType<typeof fetchMarketData>>>> = {};
  for (const { role, data } of results) {
    if (data) marketData[role] = data;
  }

  return NextResponse.json(
    { marketData },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
  );
}
