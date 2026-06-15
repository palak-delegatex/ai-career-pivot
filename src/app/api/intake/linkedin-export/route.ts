import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import JSZip from "jszip";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().optional(),
  currentTitle: z.string().optional(),
  currentIndustry: z.string().optional(),
  yearsExperience: z.number().optional(),
  skills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startYear: z.number(),
    endYear: z.number().nullable(),
    description: z.string(),
  })),
  education: z.array(z.object({
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    year: z.number().nullable(),
  })),
  certifications: z.array(z.string()),
  interests: z.array(z.string()),
  rawSummary: z.string().optional(),
});

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function findAndReadCSV(zip: JSZip, patterns: string[]): Promise<Record<string, string>[]> {
  for (const pattern of patterns) {
    const lower = pattern.toLowerCase();
    const match = Object.keys(zip.files).find(
      name => name.toLowerCase().includes(lower) && name.toLowerCase().endsWith(".csv")
    );
    if (match) {
      const text = await zip.files[match].async("text");
      return parseCSV(text);
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("linkedinExport") as File | null;
  const email = formData.get("email") as string | null;

  if (!file || !email) {
    return NextResponse.json({ error: "LinkedIn export file and email required" }, { status: 400 });
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 50MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "zip") {
    return NextResponse.json(
      { error: "Please upload the ZIP file from LinkedIn's data export (Settings > Data Privacy > Get a copy of your data)." },
      { status: 400 }
    );
  }

  let zip: JSZip;
  try {
    const bytes = await file.arrayBuffer();
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return NextResponse.json(
      { error: "Could not read the ZIP file. Make sure it's the file you downloaded from LinkedIn." },
      { status: 400 }
    );
  }

  const [positions, skills, education, certifications, profileRows, languages] = await Promise.all([
    findAndReadCSV(zip, ["position", "positions"]),
    findAndReadCSV(zip, ["skill", "skills"]),
    findAndReadCSV(zip, ["education"]),
    findAndReadCSV(zip, ["certification", "certifications"]),
    findAndReadCSV(zip, ["profile"]),
    findAndReadCSV(zip, ["language", "languages"]),
  ]);

  const hasData = positions.length || skills.length || education.length || profileRows.length;
  if (!hasData) {
    return NextResponse.json(
      { error: "No LinkedIn data found in the ZIP. Make sure you're uploading the complete data export from LinkedIn (Settings > Data Privacy > Get a copy of your data)." },
      { status: 422 }
    );
  }

  const extractedData = {
    profile: profileRows.length ? profileRows[0] : {},
    positions: positions.slice(0, 30),
    skills: skills.map(s => Object.values(s)[0]).filter(Boolean).slice(0, 100),
    education: education.slice(0, 10),
    certifications: certifications.slice(0, 20),
    languages: languages.map(l => Object.values(l)[0]).filter(Boolean).slice(0, 10),
  };

  try {
    const { output: profile } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: ProfileSchema }),
      prompt: `Extract a structured career profile from this LinkedIn data export. The data comes from CSV files in LinkedIn's official data download.

Identify transferable skills that would be valuable in a career change context. For work experience descriptions, synthesize meaningful summaries from the job titles, companies, and durations — don't leave descriptions empty.

Calculate yearsExperience from the earliest position start date to present.

LinkedIn Profile Data:
${JSON.stringify(extractedData.profile, null, 2)}

Work Positions:
${JSON.stringify(extractedData.positions, null, 2)}

Skills:
${JSON.stringify(extractedData.skills)}

Education:
${JSON.stringify(extractedData.education, null, 2)}

Certifications:
${JSON.stringify(extractedData.certifications, null, 2)}

Languages:
${JSON.stringify(extractedData.languages)}`,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Could not extract profile from LinkedIn data. Please try uploading your resume instead." },
        { status: 422 }
      );
    }

    return NextResponse.json({ profile, source: "linkedin-export" });
  } catch (err) {
    console.error("LinkedIn export parsing error:", err);
    return NextResponse.json(
      { error: "Failed to analyze LinkedIn data. Please try again." },
      { status: 500 }
    );
  }
}
