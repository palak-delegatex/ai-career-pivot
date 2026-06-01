import PDFDocument from "pdfkit";
import type { PivotPlan, SkillGap, UserProfile } from "./intake";

const PRIMARY = "#0d9488";
const SECONDARY = "#2dd4bf";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const LIGHT_BG = "#f0fdfa";
const WHITE = "#ffffff";
const EMERALD = "#059669";
const AMBER = "#d97706";
const VIOLET = "#7c3aed";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

type MilestoneType = "learn" | "achieve" | "do" | "connect";

const TYPE_LABELS: Record<MilestoneType, string> = {
  learn: "Learn",
  achieve: "Achieve",
  do: "Do",
  connect: "Connect",
};

const TYPE_COLORS: Record<MilestoneType, string> = {
  learn: VIOLET,
  achieve: EMERALD,
  do: PRIMARY,
  connect: AMBER,
};

const LEARN_KW = ["learn", "study", "course", "read", "research", "understand", "training", "education", "tutorial", "book", "watch"];
const ACHIEVE_KW = ["achieve", "earn", "obtain", "pass", "certif", "goal", "launch", "publish", "ship", "release", "degree", "award"];
const CONNECT_KW = ["network", "connect", "mentor", "community", "meetup", "conference", "linkedin", "attend", "join", "collaborate", "reach out", "contact", "interview"];

function classifyMilestone(text: string): MilestoneType {
  const lower = text.toLowerCase();
  if (CONNECT_KW.some((k) => lower.includes(k))) return "connect";
  if (LEARN_KW.some((k) => lower.includes(k))) return "learn";
  if (ACHIEVE_KW.some((k) => lower.includes(k))) return "achieve";
  return "do";
}

function groupMilestones(items: string[]): Map<MilestoneType, string[]> {
  const grouped = new Map<MilestoneType, string[]>();
  const order: MilestoneType[] = ["learn", "achieve", "do", "connect"];
  for (const t of order) grouped.set(t, []);
  for (const item of items) {
    const type = classifyMilestone(item);
    grouped.get(type)!.push(item);
  }
  for (const [key, val] of grouped) {
    if (val.length === 0) grouped.delete(key);
  }
  return grouped;
}

function drawHr(doc: PDFKit.PDFDocument, y: number, color = "#e2e8f0") {
  doc.save();
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.5).strokeColor(color).stroke();
  doc.restore();
}

function pageFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const y = PAGE_H - 35;
  drawHr(doc, y - 5, "#cbd5e1");
  doc.fontSize(7).fillColor(MUTED);
  doc.text("AICareerPivot", MARGIN, y, { width: CONTENT_W / 2, align: "left" });
  doc.text(`Page ${pageNum}`, MARGIN + CONTENT_W / 2, y, { width: CONTENT_W / 2, align: "right" });
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string, color = PRIMARY) {
  doc.fontSize(16).fillColor(color).text(text, MARGIN, doc.y);
  doc.moveDown(0.2);
  drawHr(doc, doc.y, color);
  doc.moveDown(0.5);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, pageNum: { value: number }) {
  if (doc.y + needed > PAGE_H - 60) {
    pageFooter(doc, pageNum.value);
    pageNum.value++;
    doc.addPage();
    doc.y = MARGIN + 10;
  }
}

function textHeight(doc: PDFKit.PDFDocument, text: string, fontSize: number, width: number): number {
  doc.fontSize(fontSize);
  return doc.heightOfString(text, { width }) + 4;
}

export function buildPivotPlanPdf(
  profile: UserProfile,
  plan: PivotPlan,
  createdAt?: string
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
  const pageNum = { value: 1 };

  // ─── PAGE 1: COVER ───
  doc.save();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(PRIMARY);
  doc.restore();

  doc.save();
  doc.rect(0, PAGE_H * 0.6, PAGE_W, PAGE_H * 0.4).fill(WHITE);
  doc.restore();

  doc.fontSize(10).fillColor(SECONDARY).text("AICareerPivot", MARGIN, 50);
  doc.moveDown(6);
  doc.fontSize(32).fillColor(WHITE).text("Career Pivot Plan", MARGIN, 200, { width: CONTENT_W });
  doc.moveDown(0.5);

  const subtitle = [profile.name, profile.currentTitle, profile.currentIndustry].filter(Boolean).join(" \u00B7 ");
  if (subtitle) {
    doc.fontSize(13).fillColor(SECONDARY).text(subtitle, MARGIN, doc.y, { width: CONTENT_W });
  }

  doc.moveDown(1.5);
  doc.fontSize(20).fillColor(WHITE).text(plan.targetRole, MARGIN, doc.y, { width: CONTENT_W });
  doc.fontSize(12).fillColor(SECONDARY).text(plan.targetIndustry, MARGIN, doc.y + 4, { width: CONTENT_W });

  const metricsY = PAGE_H * 0.65;
  doc.fontSize(10).fillColor(TEXT);

  const metricPairs: [string, string][] = [];
  if (plan.matchScore) metricPairs.push(["Match Score", `${plan.matchScore}%`]);
  if (plan.skillMatchPercent) metricPairs.push(["Skill Match", `${plan.skillMatchPercent}%`]);
  metricPairs.push(["Timeline", plan.estimatedTimeToTransition]);
  if (plan.financialSummary) metricPairs.push(["Salary Uplift", `+${plan.financialSummary.salaryUpliftPercent}%`]);

  const colW = CONTENT_W / metricPairs.length;
  metricPairs.forEach(([label, value], i) => {
    const x = MARGIN + i * colW;
    doc.fontSize(22).fillColor(PRIMARY).text(value, x, metricsY, { width: colW, align: "center" });
    doc.fontSize(9).fillColor(MUTED).text(label, x, metricsY + 28, { width: colW, align: "center" });
  });

  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.fontSize(9).fillColor(MUTED).text(`Generated ${dateStr}`, MARGIN, PAGE_H - 60, { width: CONTENT_W, align: "center" });
  pageFooter(doc, pageNum.value);

  // ─── PAGE 2: EXECUTIVE SUMMARY ───
  pageNum.value++;
  doc.addPage();
  doc.y = MARGIN + 10;

  sectionTitle(doc, "Executive Summary");

  const rationaleH = textHeight(doc, plan.rationale, 10, CONTENT_W);
  ensureSpace(doc, rationaleH, pageNum);
  doc.fontSize(10).fillColor(TEXT).text(plan.rationale, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
  doc.moveDown(1.2);

  if (plan.tradeoffs) {
    doc.fontSize(12).fillColor(PRIMARY).text("Path Assessment", MARGIN, doc.y);
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor(TEXT);
    doc.text(`Difficulty: ${plan.tradeoffs.difficulty}  \u00B7  Risk: ${plan.tradeoffs.riskLevel}  \u00B7  Time to First Role: ${plan.tradeoffs.timeToFirstRole}`, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.3);
    doc.text(`Near-term Income: ${plan.tradeoffs.incomeImpactNear}`, MARGIN, doc.y, { width: CONTENT_W });
    doc.text(`Long-term Potential: ${plan.tradeoffs.incomePotentialLong}`, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.5);

    if (plan.tradeoffs.pros.length) {
      ensureSpace(doc, 20, pageNum);
      doc.fontSize(10).fillColor(EMERALD).text("Advantages:", MARGIN, doc.y);
      doc.fillColor(TEXT);
      for (const p of plan.tradeoffs.pros) {
        const pH = textHeight(doc, `  \u2713  ${p}`, 10, CONTENT_W) + 2;
        ensureSpace(doc, pH, pageNum);
        doc.fontSize(10).fillColor(TEXT).text(`  \u2713  ${p}`, MARGIN, doc.y, { indent: 8, width: CONTENT_W });
        doc.moveDown(0.15);
      }
    }
    doc.moveDown(0.3);
    if (plan.tradeoffs.cons.length) {
      ensureSpace(doc, 20, pageNum);
      doc.fontSize(10).fillColor(AMBER).text("Considerations:", MARGIN, doc.y);
      doc.fillColor(TEXT);
      for (const c of plan.tradeoffs.cons) {
        const cH = textHeight(doc, `  \u2022  ${c}`, 10, CONTENT_W) + 2;
        ensureSpace(doc, cH, pageNum);
        doc.fontSize(10).fillColor(TEXT).text(`  \u2022  ${c}`, MARGIN, doc.y, { indent: 8, width: CONTENT_W });
        doc.moveDown(0.15);
      }
    }
    doc.moveDown(0.8);
  }

  if (profile.transferableSkills?.length) {
    doc.fontSize(12).fillColor(PRIMARY).text("Transferable Skills", MARGIN, doc.y);
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor(TEXT).text(profile.transferableSkills.join("  \u00B7  "), MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.8);
  }

  pageFooter(doc, pageNum.value);

  // ─── PAGES 3-5: PHASE MILESTONES ───
  const phases: { title: string; label: string; color: string; items: string[] }[] = [
    { title: "Phase 1: First 6 Months", label: "Foundation & Quick Wins", color: EMERALD, items: plan.sixMonthMilestones ?? [] },
    { title: "Phase 2: Year One", label: "Building Momentum", color: PRIMARY, items: plan.oneYearMilestones ?? [] },
    { title: "Phase 3: Year Two", label: "Acceleration & Growth", color: VIOLET, items: plan.twoYearMilestones ?? [] },
  ];

  for (const phase of phases) {
    if (!phase.items.length) continue;
    pageNum.value++;
    doc.addPage();
    doc.y = MARGIN + 10;

    sectionTitle(doc, phase.title, phase.color);
    doc.fontSize(11).fillColor(MUTED).text(phase.label, MARGIN, doc.y);
    doc.moveDown(0.8);

    const grouped = groupMilestones(phase.items);

    for (const [type, milestones] of grouped) {
      ensureSpace(doc, 60, pageNum);

      const typeColor = TYPE_COLORS[type];
      doc.save();
      doc.rect(MARGIN, doc.y, 3, 14).fill(typeColor);
      doc.restore();
      doc.fontSize(11).fillColor(typeColor).text(TYPE_LABELS[type], MARGIN + 10, doc.y + 1);
      doc.moveDown(0.5);

      for (const m of milestones) {
        const mText = `  \u2022  ${m}`;
        const mH = textHeight(doc, mText, 10, CONTENT_W - 18) + 4;
        ensureSpace(doc, mH, pageNum);
        doc.fontSize(10).fillColor(TEXT).text(mText, MARGIN + 14, doc.y, { indent: 4, width: CONTENT_W - 18 });
        doc.moveDown(0.25);
      }

      doc.moveDown(0.6);
    }

    pageFooter(doc, pageNum.value);
  }

  // ─── PAGE 6: SKILL GAP ANALYSIS ───
  if (plan.skillGaps && plan.skillGaps.length > 0) {
    pageNum.value++;
    doc.addPage();
    doc.y = MARGIN + 10;

    sectionTitle(doc, "Skill Gap Analysis", AMBER);

    doc.fontSize(10).fillColor(MUTED).text("Current level vs. required level for target role", MARGIN, doc.y);
    doc.moveDown(1);

    drawSkillGapChart(doc, plan.skillGaps, pageNum);

    doc.moveDown(1);

    const hasResources = plan.skillGaps.some((g) => g.resource);
    if (hasResources) {
      ensureSpace(doc, 40, pageNum);
      doc.fontSize(11).fillColor(PRIMARY).text("Recommended Resources by Skill", MARGIN, doc.y);
      doc.moveDown(0.4);
      for (const gap of plan.skillGaps) {
        if (!gap.resource) continue;
        ensureSpace(doc, 18, pageNum);
        doc.fontSize(9).fillColor(TEXT).text(`${gap.skill}: `, MARGIN + 8, doc.y, { continued: true });
        doc.fillColor(MUTED).text(gap.resource);
        doc.moveDown(0.15);
      }
    }

    pageFooter(doc, pageNum.value);
  }

  // ─── PAGE 7: WEEK ONE ACTIONS ───
  pageNum.value++;
  doc.addPage();
  doc.y = MARGIN + 10;

  sectionTitle(doc, "Week One Action Plan", PRIMARY);

  if (plan.weekOneActions && plan.weekOneActions.length > 0) {
    for (let i = 0; i < plan.weekOneActions.length; i++) {
      const action = plan.weekOneActions[i];
      const actionH = Math.max(56, textHeight(doc, action.instruction, 9, CONTENT_W - 44) + 36);
      ensureSpace(doc, actionH, pageNum);

      doc.save();
      doc.roundedRect(MARGIN, doc.y, CONTENT_W, 48, 4).fill(LIGHT_BG);
      doc.restore();

      const cardY = doc.y + 8;

      doc.save();
      doc.circle(MARGIN + 16, cardY + 6, 10).fill(PRIMARY);
      doc.fontSize(10).fillColor(WHITE).text(`${i + 1}`, MARGIN + 10, cardY + 1, { width: 12, align: "center" });
      doc.restore();

      doc.fontSize(11).fillColor(TEXT).text(action.title, MARGIN + 34, cardY, { width: CONTENT_W - 44 });
      doc.fontSize(9).fillColor(MUTED).text(action.instruction, MARGIN + 34, cardY + 16, { width: CONTENT_W - 44 });
      doc.fontSize(8).fillColor(PRIMARY).text(`${action.timeEstimate}  \u00B7  ${action.difficulty}`, MARGIN + 34, cardY + 30, { width: CONTENT_W - 44 });

      doc.y = doc.y + 56;
    }
  } else if (plan.keyActions && plan.keyActions.length > 0) {
    for (const action of plan.keyActions) {
      const aH = textHeight(doc, `  \u2713  ${action}`, 10, CONTENT_W) + 4;
      ensureSpace(doc, aH, pageNum);
      doc.fontSize(10).fillColor(TEXT).text(`  \u2713  ${action}`, MARGIN, doc.y, { indent: 8, width: CONTENT_W });
      doc.moveDown(0.3);
    }
  } else {
    doc.fontSize(10).fillColor(MUTED).text("Complete your profile to generate personalized week-one actions.", MARGIN, doc.y, { width: CONTENT_W });
  }

  pageFooter(doc, pageNum.value);

  // ─── PAGE 8: AI TOOLKIT ───
  if (plan.aiToolkit && plan.aiToolkit.length > 0) {
    pageNum.value++;
    doc.addPage();
    doc.y = MARGIN + 10;

    sectionTitle(doc, "AI Toolkit for Your New Role", VIOLET);

    for (const item of plan.aiToolkit) {
      ensureSpace(doc, 40, pageNum);

      doc.fontSize(11).fillColor(TEXT).text(item.tool, MARGIN, doc.y, { continued: true });
      doc.fontSize(9).fillColor(MUTED).text(`  (${item.proficiencyNeeded})`);
      doc.moveDown(0.15);
      doc.fontSize(9).fillColor(MUTED).text(`${item.category}  \u2014  ${item.useCase}`, MARGIN + 8, doc.y, { width: CONTENT_W - 8 });
      doc.moveDown(0.6);
    }

    pageFooter(doc, pageNum.value);
  }

  // ─── PAGE 9: FINANCIAL BRIDGE ───
  pageNum.value++;
  doc.addPage();
  doc.y = MARGIN + 10;

  sectionTitle(doc, "Financial Bridge", EMERALD);

  if (plan.financialSummary) {
    const fs = plan.financialSummary;

    doc.save();
    doc.roundedRect(MARGIN, doc.y, CONTENT_W, 70, 4).fill(LIGHT_BG);
    doc.restore();

    const fY = doc.y + 12;
    const halfW = CONTENT_W / 2;

    doc.fontSize(9).fillColor(MUTED).text("Current Salary Range", MARGIN + 16, fY, { width: halfW - 16 });
    doc.fontSize(14).fillColor(TEXT).text(fs.currentSalaryRange, MARGIN + 16, fY + 14, { width: halfW - 16 });

    doc.fontSize(9).fillColor(MUTED).text("Target Salary Range", MARGIN + halfW + 16, fY, { width: halfW - 32 });
    doc.fontSize(14).fillColor(EMERALD).text(fs.targetSalaryRange, MARGIN + halfW + 16, fY + 14, { width: halfW - 32 });

    doc.fontSize(10).fillColor(PRIMARY).text(`+${fs.salaryUpliftPercent}% uplift`, MARGIN + 16, fY + 40, { width: CONTENT_W - 32 });

    doc.y += 82;

    if (fs.milestoneSalaries?.length) {
      doc.fontSize(12).fillColor(PRIMARY).text("Salary Trajectory by Phase", MARGIN, doc.y);
      doc.moveDown(0.5);
      for (const ms of fs.milestoneSalaries) {
        ensureSpace(doc, 22, pageNum);
        doc.fontSize(10).fillColor(TEXT).text(`${ms.phase}: ${ms.expectedSalaryRange}`, MARGIN + 8, doc.y, { continued: true });
        doc.fontSize(9).fillColor(MUTED).text(`  \u2014  demand: ${ms.marketDemandLevel} (${ms.demandTrend})`);
        doc.moveDown(0.3);
      }
      doc.moveDown(0.6);
    }

    if (fs.transitionCosts?.length) {
      doc.fontSize(12).fillColor(PRIMARY).text("Transition Costs", MARGIN, doc.y);
      doc.moveDown(0.4);
      for (const cost of fs.transitionCosts) {
        ensureSpace(doc, 16, pageNum);
        doc.fontSize(10).fillColor(TEXT).text(`  \u2022  ${cost}`, MARGIN, doc.y, { indent: 8, width: CONTENT_W });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.5);
    }

    doc.fontSize(10).fillColor(TEXT).text(`ROI Timeframe: `, MARGIN, doc.y, { continued: true });
    doc.fillColor(PRIMARY).text(fs.roiTimeframe);
  } else if (plan.financialConsiderations) {
    doc.fontSize(10).fillColor(TEXT).text(plan.financialConsiderations, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
  } else {
    doc.fontSize(10).fillColor(MUTED).text("Financial data will appear once your profile is complete.", MARGIN, doc.y, { width: CONTENT_W });
  }

  pageFooter(doc, pageNum.value);

  // ─── PAGE 10: RESOURCES & NEXT STEPS ───
  pageNum.value++;
  doc.addPage();
  doc.y = MARGIN + 10;

  sectionTitle(doc, "Recommended Resources", PRIMARY);

  if (plan.recommendedResources && plan.recommendedResources.length > 0) {
    for (const r of plan.recommendedResources) {
      const rH = textHeight(doc, r.name, 11, CONTENT_W) + textHeight(doc, `${r.provider}  \u00B7  ${r.type}  \u00B7  ${r.cost}  \u00B7  ~${r.timeEstimate}`, 9, CONTENT_W - 8) + 8;
      ensureSpace(doc, rH, pageNum);
      doc.fontSize(11).fillColor(TEXT).text(r.name, MARGIN, doc.y, { width: CONTENT_W });
      doc.fontSize(9).fillColor(MUTED).text(`${r.provider}  \u00B7  ${r.type}  \u00B7  ${r.cost}  \u00B7  ~${r.timeEstimate}`, MARGIN + 8, doc.y, { width: CONTENT_W - 8 });
      doc.moveDown(0.6);
    }
  } else {
    doc.fontSize(10).fillColor(MUTED).text("Resources will be recommended based on your skill gap analysis.", MARGIN, doc.y, { width: CONTENT_W });
  }

  doc.moveDown(1.5);
  ensureSpace(doc, 80, pageNum);

  doc.save();
  doc.roundedRect(MARGIN, doc.y, CONTENT_W, 65, 4).fill(LIGHT_BG);
  doc.restore();

  const ctaY = doc.y + 14;
  doc.fontSize(13).fillColor(PRIMARY).text("Ready to Start Your Pivot?", MARGIN + 16, ctaY, { width: CONTENT_W - 32 });
  doc.fontSize(10).fillColor(TEXT).text("Log in to your AICareerPivot dashboard to track milestones, get AI coaching, and update your roadmap as you progress.", MARGIN + 16, ctaY + 22, { width: CONTENT_W - 32, lineGap: 2 });

  pageFooter(doc, pageNum.value);

  doc.end();
  return doc;
}

function drawSkillGapChart(doc: PDFKit.PDFDocument, gaps: SkillGap[], pageNum: { value: number }) {
  const levels: Record<string, number> = {
    none: 0, beginner: 1, basic: 1,
    intermediate: 2, proficient: 3,
    advanced: 4, expert: 5,
  };

  function toNum(level: string): number {
    return levels[level.toLowerCase()] ?? 2;
  }

  const barH = 18;
  const rowH = 32;
  const labelW = 120;
  const chartW = CONTENT_W - labelW - 10;
  const maxLevel = 5;

  for (const gap of gaps) {
    ensureSpace(doc, rowH + 4, pageNum);

    const y = doc.y;
    const currentVal = toNum(gap.currentLevel);
    const requiredVal = toNum(gap.requiredLevel);

    const priorityColor = gap.priority === "high" ? AMBER : gap.priority === "medium" ? PRIMARY : MUTED;

    doc.fontSize(9).fillColor(TEXT).text(gap.skill, MARGIN, y + 3, { width: labelW - 4, lineBreak: false });
    doc.fontSize(7).fillColor(priorityColor).text(gap.priority, MARGIN, y + 15, { width: labelW - 4 });

    const barX = MARGIN + labelW;

    doc.save();
    doc.roundedRect(barX, y + 2, chartW, barH, 3).fill("#e2e8f0");
    doc.restore();

    const reqW = (requiredVal / maxLevel) * chartW;
    doc.save();
    doc.roundedRect(barX, y + 2, reqW, barH, 3).fill("#cbd5e1");
    doc.restore();

    const curW = (currentVal / maxLevel) * chartW;
    if (curW > 0) {
      doc.save();
      doc.roundedRect(barX, y + 2, curW, barH, 3).fill(PRIMARY);
      doc.restore();
    }

    doc.fontSize(7).fillColor(WHITE);
    if (curW > 30) {
      doc.text(gap.currentLevel, barX + 4, y + 7, { width: curW - 8, lineBreak: false });
    }
    doc.fontSize(7).fillColor(MUTED);
    if (reqW > curW + 30) {
      doc.text(gap.requiredLevel, barX + curW + 4, y + 7, { width: reqW - curW - 8, lineBreak: false });
    }

    doc.y = y + rowH;
  }

  doc.moveDown(0.5);
  doc.fontSize(8).fillColor(PRIMARY).text("\u25A0 ", MARGIN, doc.y, { continued: true });
  doc.fillColor(MUTED).text("Current Level     ", { continued: true });
  doc.fillColor("#cbd5e1").text("\u25A0 ", { continued: true });
  doc.fillColor(MUTED).text("Required Level");
  doc.moveDown(0.3);
}
