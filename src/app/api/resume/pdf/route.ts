import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getTemplateConfig, type TemplatePdfConfig } from "@/lib/resume-templates";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

function getFontName(family: TemplatePdfConfig["fontFamily"]): string {
  switch (family) {
    case "serif":
      return "Times-Roman";
    case "mono":
      return "Courier";
    default:
      return "Helvetica";
  }
}

function getBoldFontName(family: TemplatePdfConfig["fontFamily"]): string {
  switch (family) {
    case "serif":
      return "Times-Bold";
    case "mono":
      return "Courier-Bold";
    default:
      return "Helvetica-Bold";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, targetRole, name, type, template: templateKey } = (await req.json()) as {
      content: string;
      targetRole: string;
      name?: string;
      type?: "resume" | "cover-letter";
      template?: string;
    };

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const config = getTemplateConfig(templateKey ?? "modern");
    const pdf = config.pdfConfig;
    const font = getFontName(pdf.fontFamily);
    const boldFont = getBoldFontName(pdf.fontFamily);
    const isNoir = templateKey === "noir";
    const isTwoColumn = pdf.layout === "two-column";
    const isCompact = pdf.layout === "compact";
    const margin = isCompact ? 40 : MARGIN;
    const contentW = PAGE_W - margin * 2;

    const doc = new PDFDocument({ size: "A4", margin, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    if (isNoir) {
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(pdf.bgColor);
    } else if (pdf.bgColor !== "#ffffff") {
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(pdf.bgColor);
    }

    const isResume = type !== "cover-letter";
    const title = isResume ? `Resume — ${targetRole}` : `Cover Letter — ${targetRole}`;

    if (templateKey === "impact") {
      doc.rect(0, 0, PAGE_W, 6).fill(pdf.primaryColor);
      doc.y = margin + 10;
    }

    if (templateKey === "bold" && name) {
      doc.rect(0, 0, PAGE_W, 70).fill("#0f172a");
      doc.font(boldFont).fontSize(20).fillColor("#ffffff").text(name, margin, 20, { width: contentW });
      doc.font(font).fontSize(12).fillColor("#2dd4bf").text(targetRole, margin, doc.y + 2, { width: contentW });
      doc.y = 85;
    } else if (templateKey === "creative") {
      doc.rect(0, 0, 6, PAGE_H).fill(pdf.primaryColor);
      const creativeGradientStops = [
        { pos: 0, color: "#0d9488" },
        { pos: 0.5, color: "#2dd4bf" },
        { pos: 1, color: "#06b6d4" },
      ];
      const gradH = PAGE_H / 3;
      creativeGradientStops.forEach((stop, i) => {
        if (i < creativeGradientStops.length - 1) {
          doc.rect(0, i * gradH, 6, gradH).fill(stop.color);
        }
      });
      doc.y = margin + 10;
    } else {
      doc.y = margin + 10;
    }

    doc.fontSize(8).fillColor(pdf.primaryColor).text("AICareerPivot", margin, 30, {
      width: contentW,
      align: "right",
    });

    if (templateKey !== "bold") {
      const nameAlign = pdf.nameAlign === "center" ? "center" : "left";
      doc.font(boldFont).fontSize(pdf.headingSize + 4).fillColor(pdf.primaryColor);
      doc.text(title, margin, doc.y, { width: contentW, align: nameAlign });
      if (name) {
        doc.font(font).fontSize(pdf.subheadingSize).fillColor(pdf.mutedColor);
        doc.text(name, margin, doc.y + 4, { width: contentW, align: nameAlign });
      }
      if (templateKey === "elegant") {
        doc.moveDown(0.3);
        const cx = PAGE_W / 2;
        doc.moveTo(cx - 25, doc.y).lineTo(cx + 25, doc.y).lineWidth(0.5).strokeColor(pdf.primaryColor).stroke();
      }
      doc.moveDown(0.8);
    }

    if (pdf.sectionDivider !== "none" && templateKey !== "bold") {
      doc.moveTo(margin, doc.y).lineTo(PAGE_W - margin, doc.y).lineWidth(0.5).strokeColor(pdf.mutedColor).stroke();
      doc.moveDown(0.6);
    }

    const bodyFontSize = isCompact ? pdf.bodySize - 1 : pdf.bodySize;

    const lines = content.split("\n");
    for (const line of lines) {
      if (doc.y > PAGE_H - 60) {
        if (isNoir || pdf.bgColor !== "#ffffff") {
          doc.addPage();
          doc.rect(0, 0, PAGE_W, PAGE_H).fill(pdf.bgColor);
          doc.y = margin + 10;
        } else {
          doc.fontSize(7).fillColor(pdf.mutedColor).text("AICareerPivot", margin, PAGE_H - 35, { width: contentW / 2, align: "left" });
          doc.addPage();
          doc.y = margin + 10;
        }
      }

      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        doc.moveDown(0.4);
        doc.font(boldFont).fontSize(pdf.headingSize + 2).fillColor(pdf.primaryColor);
        const headingText = pdf.headingStyle === "uppercase" ? trimmed.slice(2).toUpperCase() : trimmed.slice(2);
        doc.text(headingText, margin, doc.y, { width: contentW, align: pdf.nameAlign === "center" ? "center" : "left" });
        doc.moveDown(0.3);
      } else if (trimmed.startsWith("## ")) {
        doc.moveDown(0.3);
        let sectionText = pdf.headingStyle === "uppercase" ? trimmed.slice(3).toUpperCase() : trimmed.slice(3);
        if (templateKey === "terminal") sectionText = `$ ${sectionText}`;
        doc.font(boldFont).fontSize(pdf.headingSize).fillColor(pdf.primaryColor);
        doc.text(sectionText, margin, doc.y, { width: contentW, align: pdf.nameAlign === "center" ? "center" : "left" });

        if (pdf.sectionDivider === "solid" || pdf.sectionDivider === "thick") {
          const lw = pdf.sectionDivider === "thick" ? 2 : 0.5;
          const sc = pdf.sectionDivider === "thick" ? pdf.secondaryColor : pdf.primaryColor;
          doc.moveTo(margin, doc.y + 2).lineTo(PAGE_W - margin, doc.y + 2).lineWidth(lw).strokeColor(sc).stroke();
          doc.moveDown(0.15);
        } else if (pdf.sectionDivider === "dashed") {
          doc.moveTo(margin, doc.y + 2).lineTo(PAGE_W - margin, doc.y + 2).lineWidth(1).strokeColor(pdf.primaryColor).dash(4, { space: 3 }).stroke();
          doc.undash();
          doc.moveDown(0.15);
        } else if (pdf.sectionDivider === "double") {
          doc.moveTo(margin, doc.y + 2).lineTo(PAGE_W - margin, doc.y + 2).lineWidth(0.5).strokeColor(pdf.primaryColor).stroke();
          doc.moveTo(margin, doc.y + 5).lineTo(PAGE_W - margin, doc.y + 5).lineWidth(0.5).strokeColor(pdf.primaryColor).stroke();
          doc.moveDown(0.2);
        }
        doc.moveDown(0.2);
      } else if (trimmed.startsWith("### ")) {
        doc.moveDown(0.2);
        doc.font(boldFont).fontSize(pdf.subheadingSize).fillColor(pdf.textColor);
        doc.text(trimmed.slice(4), margin, doc.y, { width: contentW });
        doc.moveDown(0.15);
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        doc.font(font).fontSize(bodyFontSize).fillColor(pdf.textColor);
        doc.text(`  •  ${trimmed.slice(2)}`, margin, doc.y, { width: contentW, indent: 8 });
        doc.moveDown(0.15);
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        doc.font(boldFont).fontSize(bodyFontSize).fillColor(pdf.textColor);
        doc.text(trimmed.slice(2, -2), margin, doc.y, { width: contentW });
        doc.moveDown(0.15);
      } else if (trimmed === "") {
        doc.moveDown(0.3);
      } else {
        doc.font(font).fontSize(bodyFontSize).fillColor(pdf.textColor);
        doc.text(trimmed, margin, doc.y, { width: contentW, lineGap: 2 });
        doc.moveDown(0.15);
      }
    }

    doc.font(font).fontSize(7).fillColor(pdf.mutedColor).text("AICareerPivot", margin, PAGE_H - 35, { width: contentW / 2, align: "left" });

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
  } catch (err) {
    console.error("Resume PDF generation failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
