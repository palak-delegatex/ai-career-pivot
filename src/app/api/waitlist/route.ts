import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, email, persona, utm_source, utm_medium, utm_campaign } =
      await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();

    // next_email_at = 3 days from now (for Email 2 — Day 3)
    const nextEmailAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("waitlist").insert({
      name: trimmedName,
      email: trimmedEmail,
      persona: persona || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      email_step: 2,
      next_email_at: nextEmailAt,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: true, alreadyOnList: true },
          { status: 200 }
        );
      }
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    // Send Email 1 immediately (non-blocking — don't await to keep response fast)
    const firstName = trimmedName.split(" ")[0];
    sendDripEmail(trimmedEmail, firstName, 1).catch((err) =>
      console.error("Email 1 send error (non-fatal):", err)
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
