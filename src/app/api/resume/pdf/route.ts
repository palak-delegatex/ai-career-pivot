import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

const PRIMARY = "#0d9488";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const WHITE = "#ffffff";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

export async function POST(req: NextRequest) {
  const { content, targetRole, name, type } = (await req.json()) as {
    content: string;
    targetRole: string;
    name?: string;
    type?: "resume" | "cover-letter";
  };

  if (!content) {
    return new Response(JSON.stringify({ error: "content is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const isResume = type !== "cover-letter";
  const title = isResume
    ? `Resume — ${targetRole}`
    : `Cover Letter — ${targetRole}`;

  doc.fontSize(8).fillColor(PRIMARY).text("AICareerPivot", MARGIN, 30, {
    width: CONTENT_W,
    align: "right",
  });

  doc.fontSize(18).fillColor(TEXT).text(title, MARGIN, MARGIN + 10, {
    width: CONTENT_W,
  });
  if (name) {
    doc.fontSize(11).fillColor(MUTED).text(name, MARGIN, doc.y + 4, {
      width: CONTENT_W,
    });
  }
  doc.moveDown(0.8);

  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(PAGE_W - MARGIN, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cbd5e1")
    .stroke();
  doc.moveDown(0.6);

  const lines = content.split("\n");
  for (const line of lines) {
    if (doc.y > PAGE_H - 60) {
      doc
        .fontSize(7)
        .fillColor(MUTED)
        .text("AICareerPivot", MARGIN, PAGE_H - 35, {
          width: CONTENT_W / 2,
          align: "left",
        });
      doc.addPage();
      doc.y = MARGIN + 10;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      doc.moveDown(0.4);
      doc
        .fontSize(16)
        .fillColor(PRIMARY)
        .text(trimmed.slice(2), MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.3);
    } else if (trimmed.startsWith("## ")) {
      doc.moveDown(0.3);
      doc
        .fontSize(13)
        .fillColor(PRIMARY)
        .text(trimmed.slice(3), MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.2);
    } else if (trimmed.startsWith("### ")) {
      doc.moveDown(0.2);
      doc
        .fontSize(11)
        .fillColor(TEXT)
        .text(trimmed.slice(4), MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.15);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      doc
        .fontSize(10)
        .fillColor(TEXT)
        .text(`  •  ${trimmed.slice(2)}`, MARGIN, doc.y, {
          width: CONTENT_W,
          indent: 8,
        });
      doc.moveDown(0.15);
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      doc
        .fontSize(10)
        .fillColor(TEXT)
        .text(trimmed.slice(2, -2), MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.15);
    } else if (trimmed === "") {
      doc.moveDown(0.3);
    } else {
      doc
        .fontSize(10)
        .fillColor(TEXT)
        .text(trimmed, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
      doc.moveDown(0.15);
    }
  }

  doc
    .fontSize(7)
    .fillColor(MUTED)
    .text("AICareerPivot", MARGIN, PAGE_H - 35, {
      width: CONTENT_W / 2,
      align: "left",
    });

  doc.end();
  const pdfBuffer = await done;

  const filename = isResume
    ? `Resume_${targetRole.replace(/\s+/g, "_")}.pdf`
    : `CoverLetter_${targetRole.replace(/\s+/g, "_")}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
