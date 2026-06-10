import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

interface LinkedInRow {
  "First Name": string;
  "Last Name": string;
  "Email Address"?: string;
  Company?: string;
  Position?: string;
  "Connected On"?: string;
  URL?: string;
}

function parseCSV(text: string): LinkedInRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: LinkedInRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row as unknown as LinkedInRow);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = formData.get("email") as string;
  const file = formData.get("file") as File | null;

  if (!email || !file) {
    return NextResponse.json(
      { error: "email and file required" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No contacts found in CSV" },
      { status: 400 }
    );
  }

  const contacts = rows
    .filter((r) => r["First Name"] || r["Last Name"])
    .map((r) => ({
      user_email: email,
      name: [r["First Name"], r["Last Name"]].filter(Boolean).join(" "),
      email: r["Email Address"] || null,
      linkedin_url: r["URL"] || null,
      company: r["Company"] || null,
      role: r["Position"] || null,
      source: "linkedin-import",
      strength_score: 20,
      strength_tier: "new",
      tags: ["linkedin-import"],
      notes: "",
    }));

  const supabase = getSupabaseClient();

  const BATCH_SIZE = 100;
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("contacts").insert(batch);
    if (error) {
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      imported += batch.length;
    }
  }

  return NextResponse.json({
    imported,
    total: contacts.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
