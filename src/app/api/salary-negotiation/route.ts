import { NextRequest, NextResponse } from "next/server";
import { analyzeSalaryNegotiation } from "@/lib/salary-negotiation";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { role, location, experienceYears, targetCompany, userConstraintFloor, offerAmount } =
    body as {
      role?: string;
      location?: string;
      experienceYears?: number;
      targetCompany?: string;
      userConstraintFloor?: number;
      offerAmount?: number;
    };

  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  if (experienceYears == null || typeof experienceYears !== "number" || experienceYears < 0) {
    return NextResponse.json(
      { error: "experienceYears is required and must be a non-negative number" },
      { status: 400 }
    );
  }

  const result = await analyzeSalaryNegotiation({
    role,
    location,
    experienceYears,
    targetCompany,
    userConstraintFloor,
    offerAmount,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Could not find market data for the specified role" },
      { status: 404 }
    );
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
