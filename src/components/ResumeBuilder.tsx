"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Save,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  Eye,
} from "lucide-react";
import type { PivotPlan, UserProfile, SkillGap } from "@/lib/intake";
import type { ResumeVersion } from "./ResumeVersionList";
import {
  type Template,
  type TemplateCategory,
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_THEMES,
  getTheme,
} from "@/lib/resume-templates";
import { useRealtimeScore } from "@/hooks/use-realtime-score";
import { LiveScorePanel } from "@/components/LiveScorePanel";

function skillTransferCategory(gap: SkillGap): "direct" | "partial" | "new" {
  if (gap.transferCategory === "direct-transfer") return "direct";
  if (gap.transferCategory === "partial-transfer") return "partial";
  if (gap.transferCategory === "new-skill") return "new";
  const score = gap.transferabilityScore ?? 0;
  if (score >= 70) return "direct";
  if (score >= 40) return "partial";
  return "new";
}

const TRANSFER_STYLES = {
  direct: {
    label: "Direct Transfer",
    className: "bg-emerald-900/40 border-emerald-600/30 text-emerald-300",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-900/40 border-amber-600/30 text-amber-300",
  },
  new: {
    label: "New Skill",
    className: "bg-red-900/30 border-red-600/30 text-red-300",
  },
};

interface ResumeBuilderProps {
  profile: UserProfile;
  plan: PivotPlan;
  version?: ResumeVersion;
  onSave: (data: {
    name: string;
    target_role: string;
    target_company: string;
    template: Template;
    theme_id: string;
    enabled_skills: string[];
    enabled_experience_indices: number[];
    sections: Record<string, boolean>;
    generated_text: string | null;
  }) => void;
  onBack: () => void;
  saving?: boolean;
}

function renderPreview(
  profile: UserProfile,
  plan: PivotPlan,
  selectedSkills: Set<string>,
  includedExperience: Set<number>,
  sections: Record<string, boolean>,
  template: Template,
  versionName: string
): string {
  const lines: string[] = [];
  const name = profile.name || "Your Name";
  const role = plan.targetRole || "Target Role";

  lines.push(name.toUpperCase());
  lines.push(role);
  lines.push(
    [profile.email, profile.linkedinUrl, profile.websiteUrl]
      .filter(Boolean)
      .join(" | ")
  );
  lines.push("");

  if (sections.summary !== false) {
    lines.push("─── PROFESSIONAL SUMMARY ───");
    lines.push(
      `Results-driven professional transitioning to ${role} with ${profile.yearsExperience || "several"} years of experience. ` +
      `Bringing transferable skills in ${[...selectedSkills].slice(0, 3).join(", ")}.`
    );
    lines.push("");
  }

  if (sections.skills !== false && selectedSkills.size > 0) {
    lines.push("─── SKILLS ───");
    lines.push([...selectedSkills].join(" · "));
    lines.push("");
  }

  if (sections.experience !== false) {
    lines.push("─── EXPERIENCE ───");
    profile.experience.forEach((exp, i) => {
      if (!includedExperience.has(i)) return;
      lines.push(
        `${exp.title} — ${exp.company} (${exp.startYear}–${exp.endYear ?? "Present"})`
      );
      if (exp.description) {
        exp.description.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed) lines.push(`  • ${trimmed}`);
        });
      }
      lines.push("");
    });
  }

  if (sections.education !== false && profile.education.length > 0) {
    lines.push("─── EDUCATION ───");
    profile.education.forEach((edu) => {
      lines.push(
        `${edu.degree} in ${edu.field} — ${edu.institution}${edu.year ? ` (${edu.year})` : ""}`
      );
    });
    lines.push("");
  }

  if (sections.certifications !== false && profile.certifications.length > 0) {
    lines.push("─── CERTIFICATIONS ───");
    profile.certifications.forEach((c) => lines.push(`  • ${c}`));
    lines.push("");
  }

  return lines.join("\n");
}

export default function ResumeBuilder({
  profile,
  plan,
  version,
  onSave,
  onBack,
  saving,
}: ResumeBuilderProps) {
  const allSkills = [
    ...profile.transferableSkills.map((s) => ({
      skill: s,
      category: "direct" as const,
    })),
    ...(plan.skillGaps ?? []).map((g) => ({
      skill: g.skill,
      category: skillTransferCategory(g),
    })),
  ];
  const uniqueSkills = allSkills.filter(
    (s, i, arr) =>
      arr.findIndex((x) => x.skill.toLowerCase() === s.skill.toLowerCase()) === i
  );

  const [versionName, setVersionName] = useState(
    version?.name || `${plan.targetRole} Resume`
  );
  const [targetCompany, setTargetCompany] = useState(
    version?.target_company || ""
  );
  const [template, setTemplate] = useState<Template>(
    (version?.template as Template) || "professional"
  );
  const [themeId, setThemeId] = useState<string>(
    () => {
      const vThemeId = version && "theme_id" in version ? (version as unknown as { theme_id?: string }).theme_id : undefined;
      return vThemeId || getTheme((version?.template as Template) || "professional").id;
    }
  );
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    () =>
      new Set(
        version?.enabled_skills?.length
          ? version.enabled_skills
          : uniqueSkills
              .filter((s) => s.category !== "new")
              .map((s) => s.skill)
      )
  );
  const [includedExperience, setIncludedExperience] = useState<Set<number>>(
    () =>
      new Set(
        version?.enabled_experience_indices?.length
          ? version.enabled_experience_indices
          : profile.experience.map((_, i) => i)
      )
  );
  const [sections, setSections] = useState<Record<string, boolean>>(() => ({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    ...((version?.sections as Record<string, boolean>) || {}),
  }));

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }, []);

  const toggleExperience = useCallback((index: number) => {
    setIncludedExperience((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSection = useCallback((key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const preview = renderPreview(
    profile,
    plan,
    selectedSkills,
    includedExperience,
    sections,
    template,
    versionName
  );

  const { scores, score: triggerScore } = useRealtimeScore(500);

  useEffect(() => {
    if (preview.trim().length > 20) {
      triggerScore(preview);
    }
  }, [preview, triggerScore]);

  const filteredTemplates =
    categoryFilter === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === categoryFilter);

  function handleTemplateChange(t: Template) {
    setTemplate(t);
    setThemeId(getTheme(t).id);
  }

  function handleSave() {
    onSave({
      name: versionName,
      target_role: plan.targetRole,
      target_company: targetCompany,
      template,
      theme_id: themeId,
      enabled_skills: [...selectedSkills],
      enabled_experience_indices: [...includedExperience],
      sections,
      generated_text: preview,
    });
  }

  const SECTION_ITEMS = [
    { key: "summary", label: "Professional Summary", icon: FileText },
    { key: "skills", label: "Skills", icon: Wrench },
    { key: "experience", label: "Experience", icon: Briefcase },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "certifications", label: "Certifications", icon: Award },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left panel — controls */}
      <div className="lg:w-1/2 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-bold text-slate-100">
            {version ? "Edit Version" : "New Version"}
          </h3>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)] pr-3">
          <div className="space-y-5">
            {/* Name + company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Version Name
                </label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Target Company
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Template selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">
                Template
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    categoryFilter === "all"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      categoryFilter === cat.key
                        ? "bg-teal-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTemplateChange(t.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      template === t.key
                        ? "bg-teal-900/30 border-teal-600/50 ring-1 ring-teal-500/30"
                        : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-200 block">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Color theme swatches */}
              <div className="mt-3">
                <label className="text-[10px] text-slate-500 mb-1.5 block">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  {TEMPLATE_THEMES[template].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setThemeId(theme.id)}
                      title={theme.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        themeId === theme.id
                          ? "border-white ring-2 ring-teal-500/50 scale-110"
                          : "border-slate-600 hover:border-slate-400"
                      }`}
                      style={{ backgroundColor: theme.swatch }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Section toggles */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">
                Sections
              </label>
              <div className="space-y-1.5">
                {SECTION_ITEMS.map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={sections[key] !== false}
                      onCheckedChange={() => toggleSection(key)}
                    />
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-200">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <Accordion type="single" collapsible defaultValue="skills">
              <AccordionItem value="skills" className="border-slate-700/50">
                <AccordionTrigger className="text-sm text-slate-200 hover:no-underline py-3">
                  <span className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-teal-400" />
                    Skills ({selectedSkills.size}/{uniqueSkills.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {uniqueSkills.map(({ skill, category }) => {
                      const active = selectedSkills.has(skill);
                      const style = TRANSFER_STYLES[category];
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-all ${
                            active
                              ? style.className
                              : "bg-slate-800/60 border-slate-700/40 text-slate-500"
                          }`}
                        >
                          {skill}
                          {active && (
                            <Badge className={`text-[8px] border px-1 py-0 ${style.className}`}>
                              {style.label}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Experience bullets */}
            <Accordion type="single" collapsible defaultValue="experience">
              <AccordionItem value="experience" className="border-slate-700/50">
                <AccordionTrigger className="text-sm text-slate-200 hover:no-underline py-3">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-teal-400" />
                    Experience ({includedExperience.size}/{profile.experience.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-1">
                    {profile.experience.map((exp, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={includedExperience.has(i)}
                          onCheckedChange={() => toggleExperience(i)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-200 block">
                            {exp.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {exp.company} · {exp.startYear}–{exp.endYear ?? "Present"}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <button
          onClick={handleSave}
          disabled={saving || !versionName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : version ? "Update Version" : "Save Version"}
        </button>
      </div>

      {/* Right panel — live preview + score */}
      <div className="lg:w-1/2 flex flex-col gap-3">
        <LiveScorePanel scores={scores} />
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Preview
          </span>
          <Badge className="text-[9px] bg-slate-700/60 border-slate-600/40 text-slate-300">
            {template}
          </Badge>
        </div>
        <div className="flex-1 rounded-xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-480px)]">
            <pre className="p-6 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {preview}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
