import PDFDocument from "pdfkit";
import type { PivotPlan, UserProfile } from "./intake";

const TEAL = "#0d9488";
const SLATE = "#334155";
const LIGHT_GRAY = "#f1f5f9";
const EMERALD = "#059669";
const AMBER = "#d97706";
const VIOLET = "#7c3aed";

function heading(doc: PDFKit.PDFDocument, text: string, color: string) {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor(color).text(text);
  doc.moveDown(0.3);
  doc.fillColor(SLATE);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  doc.fontSize(10).fillColor(SLATE);
  for (const item of items) {
    doc.text(`  \u2022  ${item}`, { indent: 8 });
    doc.moveDown(0.2);
  }
}

export function buildPivotPlanPdf(
  profile: UserProfile,
  plan: PivotPlan,
  createdAt?: string
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Header
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("AICareerPivot", 50, 35, { align: "left" });
  if (createdAt) {
    doc.text(new Date(createdAt).toLocaleDateString(), 50, 35, {
      align: "right",
    });
  }

  // Title
  doc.moveDown(1.5);
  doc.fontSize(22).fillColor(SLATE).text("Career Pivot Plan", { align: "center" });
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .fillColor("#64748b")
    .text(
      [
        profile.name,
        profile.currentTitle,
        profile.currentIndustry,
      ]
        .filter(Boolean)
        .join(" \u00B7 "),
      { align: "center" }
    );

  // Target role section
  doc.moveDown(1);
  doc.fontSize(16).fillColor(TEAL).text(plan.targetRole);
  doc.fontSize(10).fillColor("#64748b").text(plan.targetIndustry);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(SLATE).text(plan.rationale, { lineGap: 2 });

  // Metrics strip
  doc.moveDown(0.6);
  const metrics: string[] = [];
  if (plan.matchScore) metrics.push(`Match: ${plan.matchScore}%`);
  if (plan.skillMatchPercent) metrics.push(`Skills: ${plan.skillMatchPercent}%`);
  metrics.push(`Timeline: ${plan.estimatedTimeToTransition}`);
  if (plan.financialSummary)
    metrics.push(`Uplift: +${plan.financialSummary.salaryUpliftPercent}%`);
  doc.fontSize(9).fillColor(TEAL).text(metrics.join("   |   "));

  // 1. Milestones
  if (plan.sixMonthMilestones?.length) {
    heading(doc, "6-Month Milestones", EMERALD);
    bulletList(doc, plan.sixMonthMilestones);
  }

  if (plan.oneYearMilestones?.length) {
    heading(doc, "1-Year Milestones", TEAL);
    bulletList(doc, plan.oneYearMilestones);
  }

  if (plan.twoYearMilestones?.length) {
    heading(doc, "2-Year Milestones", TEAL);
    bulletList(doc, plan.twoYearMilestones);
  }

  // 2. Skill Gaps
  if (plan.skillGaps && plan.skillGaps.length > 0) {
    heading(doc, "Skill Gaps to Close", AMBER);
    doc.fontSize(10).fillColor(SLATE);
    for (const gap of plan.skillGaps) {
      doc.text(
        `  \u2022  ${gap.skill} \u2014 ${gap.currentLevel} \u2192 ${gap.requiredLevel} [${gap.priority}]`,
        { indent: 8 }
      );
      if (gap.resource) {
        doc.fontSize(9).fillColor("#64748b").text(`      Resource: ${gap.resource}`, { indent: 8 });
        doc.fillColor(SLATE).fontSize(10);
      }
      doc.moveDown(0.2);
    }
  }

  // 3. Week One Actions
  if (plan.weekOneActions && plan.weekOneActions.length > 0) {
    heading(doc, "Key Actions This Week", TEAL);
    doc.fontSize(10).fillColor(SLATE);
    for (const action of plan.weekOneActions) {
      doc.text(`  \u2713  ${action.title} \u2014 ${action.instruction} (${action.timeEstimate})`, {
        indent: 8,
      });
      doc.moveDown(0.2);
    }
  } else if (plan.keyActions && plan.keyActions.length > 0) {
    heading(doc, "Key Actions This Week", TEAL);
    bulletList(doc, plan.keyActions);
  }

  // 4. AI Toolkit
  if (plan.aiToolkit && plan.aiToolkit.length > 0) {
    heading(doc, "AI Toolkit for This Role", VIOLET);
    doc.fontSize(10).fillColor(SLATE);
    for (const item of plan.aiToolkit) {
      doc.text(`  \u2022  ${item.tool} (${item.proficiencyNeeded})`, { indent: 8 });
      doc.fontSize(9).fillColor("#64748b").text(`      ${item.category} \u2014 ${item.useCase}`, { indent: 8 });
      doc.fillColor(SLATE).fontSize(10);
      doc.moveDown(0.2);
    }
  }

  // 5. Financial Summary
  if (plan.financialSummary) {
    heading(doc, "Salary & Financial Bridge", EMERALD);
    const fs = plan.financialSummary;
    doc.fontSize(10).fillColor(SLATE);
    doc.text(`Current Range: ${fs.currentSalaryRange}`);
    doc.text(`Target Range:  ${fs.targetSalaryRange}  (+${fs.salaryUpliftPercent}%)`);
    if (fs.transitionCosts?.length) {
      doc.moveDown(0.3);
      doc.text("Transition Costs:");
      bulletList(doc, fs.transitionCosts);
    }
    doc.moveDown(0.2);
    doc.text(`ROI Timeframe: ${fs.roiTimeframe}`);
  } else if (plan.financialConsiderations) {
    heading(doc, "Financial Considerations", SLATE);
    doc.fontSize(10).fillColor(SLATE).text(plan.financialConsiderations, { lineGap: 2 });
  }

  // 6. Recommended Resources
  if (plan.recommendedResources && plan.recommendedResources.length > 0) {
    heading(doc, "Recommended Resources", TEAL);
    doc.fontSize(10).fillColor(SLATE);
    for (const r of plan.recommendedResources) {
      doc.text(`  \u2022  ${r.name} (${r.provider}) \u2014 ${r.type}, ${r.cost}, ~${r.timeEstimate}`, {
        indent: 8,
      });
      doc.moveDown(0.2);
    }
  }

  // 7. Transferable Skills
  if (profile.transferableSkills?.length) {
    heading(doc, "Transferable Skills", TEAL);
    doc.fontSize(10).fillColor(SLATE).text(profile.transferableSkills.join("  \u00B7  "));
  }

  // Footer
  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("Generated by AICareerPivot \u00B7 ai-career-pivot.com", { align: "center" });

  doc.end();
  return doc;
}
