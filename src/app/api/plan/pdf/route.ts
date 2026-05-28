import { NextRequest, NextResponse } from "next/server";
import { buildPivotPlanPdf } from "@/lib/pdf-builder";
import type { PivotPlan, UserProfile } from "@/lib/intake";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profile = body.profile as UserProfile | undefined;
    const plan = body.plan as PivotPlan | undefined;

    if (!profile || !plan) {
      return NextResponse.json(
        { error: "Missing profile or plan data" },
        { status: 400 }
      );
    }

    const doc = buildPivotPlanPdf(profile, plan);

    const chunks: Uint8Array[] = [];
    await new Promise<void>((resolve, reject) => {
      doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const filename = `career-pivot-${plan.targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
