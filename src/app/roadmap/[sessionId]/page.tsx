import { redirect } from "next/navigation";
import { getPaidSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const paid = await getPaidSession(sessionId);
  if (!paid) {
    redirect(`/checkout/cancel?reason=not_paid&session_id=${sessionId}`);
  }

  redirect(`/onboarding/roadmap?session_id=${sessionId}`);
}
