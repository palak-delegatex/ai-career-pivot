import { NextRequest, NextResponse } from "next/server";
import { fetchMarketData, fetchMarketContext } from "@/lib/market-data";

const SUGGESTED_ROLES = [
  "software engineer",
  "data scientist",
  "product manager",
  "ux designer",
  "cybersecurity analyst",
  "project manager",
  "business analyst",
  "devops engineer",
  "financial analyst",
  "marketing manager",
];

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
};

export async function POST(req: NextRequest) {
  const {
    roles,
    role,
    includeContext = false,
  }: {
    roles?: string[];
    role?: string;
    includeContext?: boolean;
  } = await req.json();

  if (role) {
    if (role.trim().length < 2) {
      return NextResponse.json(
        { error: "role must be at least 2 characters" },
        { status: 400 }
      );
    }

    try {
      if (includeContext) {
        const context = await fetchMarketContext(role);
        if (!context) {
          return NextResponse.json(
            { error: `No market data for "${role}"`, suggestedRoles: SUGGESTED_ROLES },
            { status: 404 }
          );
        }
        return NextResponse.json(context, { headers: CACHE_HEADERS });
      }

      const data = await fetchMarketData(role);
      if (!data) {
        return NextResponse.json(
          { error: `No market data for "${role}"`, suggestedRoles: SUGGESTED_ROLES },
          { status: 404 }
        );
      }
      return NextResponse.json(data, { headers: CACHE_HEADERS });
    } catch (err) {
      console.error("Market data error:", err);
      return NextResponse.json(
        { error: "Failed to fetch market data" },
        { status: 500 }
      );
    }
  }

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json(
      { error: "roles array or role string required" },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    roles.slice(0, 5).map(async (r) => ({
      role: r,
      data: includeContext
        ? await fetchMarketContext(r)
        : await fetchMarketData(r),
    }))
  );

  const marketData: Record<string, NonNullable<(typeof results)[number]["data"]>> = {};
  for (const { role: r, data } of results) {
    if (data) marketData[r] = data;
  }

  return NextResponse.json({ marketData }, { headers: CACHE_HEADERS });
}
