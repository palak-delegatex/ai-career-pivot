import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const ProfileSchema = z.object({
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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File | null;
  const email = formData.get("email") as string | null;

  if (!file || !email) {
    return NextResponse.json({ error: "resume file and email required" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, DOCX, DOC, and TXT files are supported" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  // Claude natively handles PDFs via document type; for DOCX/TXT send as text
  let messages: Parameters<typeof generateText>[0]["messages"];

  if (file.type === "application/pdf") {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: base64,
            mimeType: "application/pdf",
          } as never,
          {
            type: "text",
            text: "Extract a complete structured career profile from this resume. Identify all skills, experience, education, and certifications. Also identify transferable skills — abilities that would remain valuable if the person changed careers.",
          },
        ],
      },
    ];
  } else {
    // For DOCX/TXT, convert to text via simple approach
    const textContent = new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");
    messages = [
      {
        role: "user",
        content: `Extract a complete structured career profile from this resume text. Identify all skills, experience, education, and certifications. Also identify transferable skills — abilities that would remain valuable if the person changed careers.\n\nResume:\n${textContent}`,
      },
    ];
  }

  const { output: profile } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: ProfileSchema }),
    messages,
  });

  return NextResponse.json({ profile });
}
