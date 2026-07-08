import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import type { UserProfile } from "@/lib/intake";

/**
 * Deferred email capture (AIC-618 D1 / AIC-776).
 *
 * The free entry flow no longer collects an email up front — the user gets
 * their snapshot first (see FreeUploadClient), then can opt in to have the
 * results emailed to them from /free-results. This route receives that
 * deferred email plus the already-generated snapshot and fires the same
 * "your snapshot is ready" drip email (step 17) that free-snapshot used to
 * send inline when an email was present.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; snapshot?: FreeSnapshot; profile?: Partial<UserProfile> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim() ?? "";
  const snapshot = body.snapshot;
  const profile = body.profile;

  // Minimal email sanity check — the drip send itself no-ops without a key.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (!snapshot?.paths?.length) {
    return NextResponse.json({ error: "No snapshot to send" }, { status: 400 });
  }

  // Same first-name derivation the inline path used, kept intentionally lenient.
  const firstName = profile?.currentTitle?.split(" ")[0] ?? "there";

  // Fire-and-forget: never block the user's confirmation on the mail provider.
  sendDripEmail(email, firstName, 17, {
    freeSnapshotPaths: snapshot.paths.map((p) => ({
      targetRole: p.targetRole,
      targetIndustry: p.targetIndustry,
      matchScore: p.matchScore,
      rationale: p.rationale,
    })),
    topStrengths: snapshot.topTransferableStrengths?.map((s) => s.skill) ?? [],
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
