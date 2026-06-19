"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, Check, Eye, Sparkles } from "lucide-react";
import {
  TEMPLATE_CONFIGS,
  TEMPLATE_KEYS,
  STYLE_CATEGORIES,
  INDUSTRY_TAGS,
  type TemplateKey,
  type StyleCategory,
  type IndustryTag,
  type TemplateConfig,
} from "@/lib/resume-templates";

interface TemplateGalleryProps {
  selected: string;
  onSelect: (key: TemplateKey) => void;
  compact?: boolean;
}

function AtsBadge({ score }: { score: number }) {
  const isHigh = score >= 90;
  return (
    <span
      className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${
        isHigh
          ? "bg-emerald-500/85 text-white"
          : "bg-amber-500/85 text-white"
      }`}
    >
      <Check className="h-2.5 w-2.5" />
      {score}%
    </span>
  );
}

function MiniResumePreview({ templateKey }: { templateKey: TemplateKey }) {
  const config = TEMPLATE_CONFIGS[templateKey];
  const { pdfConfig } = config;

  const fontClass =
    pdfConfig.fontFamily === "serif"
      ? "font-serif"
      : pdfConfig.fontFamily === "mono"
        ? "font-mono"
        : "font-sans";

  const isNoir = templateKey === "noir";
  const isTwoColumn = templateKey === "two-column";
  const isBold = templateKey === "bold";
  const isCreative = templateKey === "creative";
  const isSwiss = templateKey === "swiss";
  const isImpact = templateKey === "impact";
  const isMetric = templateKey === "metric" || templateKey === "data";
  const isTerminal = templateKey === "terminal";
  const isPivot = templateKey === "pivot" || templateKey === "storyteller";
  const isElegant = templateKey === "elegant";
  const isCompact = templateKey === "compact";
  const isCentered = pdfConfig.nameAlign === "center";
  const textAlign = isCentered ? "text-center" : "text-left";

  const bgStyle = isNoir ? { background: "#0f172a" } : pdfConfig.bgColor !== "#ffffff" ? { background: pdfConfig.bgColor } : {};

  if (isTerminal) {
    return (
      <div
        className={`w-full h-full ${fontClass} relative overflow-hidden`}
        style={{ fontSize: "5.5px", lineHeight: 1.5, background: "#0c0c0c" }}
      >
        <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ background: "#1a1a1a", borderBottom: "0.5px solid #333" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#28c840" }} />
          <span className="ml-1 text-[3.5px]" style={{ color: "#64748b" }}>resume.sh</span>
        </div>
        <div className="p-3">
          <div className="text-[8px] font-bold" style={{ color: "#22c55e" }}>ALEX CHEN</div>
          <div className="text-[4.5px]" style={{ color: "#16a34a" }}>Senior Product Manager</div>
          <div className="text-[3.5px]" style={{ color: "#64748b" }}>alex@email.com | SF, CA</div>

          <div className="mt-1.5 mb-0.5 font-bold text-[4.5px]" style={{ color: "#22c55e", borderBottom: "1px dashed #333", paddingBottom: "1px" }}>$ Summary</div>
          <div className="rounded mb-0.5" style={{ background: "#1a1a1a", height: "3px", width: "100%" }} />
          <div className="rounded mb-1" style={{ background: "#1a1a1a", height: "3px", width: "85%" }} />

          <div className="mt-1 mb-0.5 font-bold text-[4.5px]" style={{ color: "#22c55e", borderBottom: "1px dashed #333", paddingBottom: "1px" }}>$ Skills</div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {["Python", "Bash", "Docker", "K8s"].map((s) => (
              <span key={s} className="px-1 py-px rounded text-[3.5px]" style={{ color: "#22c55e", border: "0.5px solid #22c55e40" }}>{s}</span>
            ))}
          </div>

          <div className="mt-1.5 mb-0.5 font-bold text-[4.5px]" style={{ color: "#22c55e", borderBottom: "1px dashed #333", paddingBottom: "1px" }}>$ Experience</div>
          <div className="font-semibold text-[4.5px]" style={{ color: "#e2e8f0" }}>Product Manager — TechCorp</div>
          <div className="text-[3.5px] mb-0.5" style={{ color: "#64748b" }}>2020 – Present</div>
          <div className="rounded mb-0.5" style={{ background: "#1a1a1a", height: "3px", width: "90%" }} />
          <div className="rounded" style={{ background: "#1a1a1a", height: "3px", width: "75%" }} />
        </div>
      </div>
    );
  }

  if (isTwoColumn) {
    return (
      <div
        className={`w-full h-full ${fontClass} relative overflow-hidden`}
        style={{ fontSize: "5.5px", lineHeight: 1.5 }}
      >
        <div className="flex h-full">
          <div className="w-[35%] p-2.5 flex flex-col gap-1.5" style={{ background: "#0f172a" }}>
            <div className="text-[7px] font-bold text-white">ALEX CHEN</div>
            <div className="text-[4.5px]" style={{ color: "#2dd4bf" }}>Product Manager</div>
            <div className="text-[3.5px] opacity-40 text-white">alex@email.com</div>
            <div className="mt-1.5" style={{ color: "#2dd4bf", borderBottom: "0.5px solid rgba(255,255,255,0.1)", fontSize: "4px", paddingBottom: "1px" }}>SKILLS</div>
            <div className="flex flex-wrap gap-0.5">
              {["Product", "Agile", "SQL"].map((s) => (
                <span key={s} className="px-1 py-px rounded text-[3.5px]" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>{s}</span>
              ))}
            </div>
            <div className="mt-1" style={{ color: "#2dd4bf", borderBottom: "0.5px solid rgba(255,255,255,0.1)", fontSize: "4px", paddingBottom: "1px" }}>CONTACT</div>
            <div className="rounded h-1.5" style={{ background: "rgba(255,255,255,0.1)", width: "90%" }} />
            <div className="rounded h-1.5" style={{ background: "rgba(255,255,255,0.1)", width: "70%" }} />
          </div>
          <div className="flex-1 p-2.5">
            <div className="font-bold mb-1" style={{ color: "#0d9488", borderBottom: "1px solid #e2e8f0", fontSize: "5px", paddingBottom: "1px" }}>SUMMARY</div>
            <div className="rounded h-1.5 mb-0.5" style={{ background: "#e2e8f0", width: "100%" }} />
            <div className="rounded h-1.5 mb-1.5" style={{ background: "#e2e8f0", width: "85%" }} />
            <div className="font-bold mb-1" style={{ color: "#0d9488", borderBottom: "1px solid #e2e8f0", fontSize: "5px", paddingBottom: "1px" }}>EXPERIENCE</div>
            <div className="font-semibold text-[4.5px] mb-px" style={{ color: "#0f172a" }}>PM — TechCorp</div>
            <div className="text-[3.5px] mb-0.5" style={{ color: "#64748b" }}>2020 – Present</div>
            <div className="rounded h-1.5 mb-0.5" style={{ background: "#e2e8f0", width: "90%" }} />
            <div className="rounded h-1.5" style={{ background: "#e2e8f0", width: "75%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full ${fontClass} p-3.5 relative overflow-hidden`}
      style={{ fontSize: isCompact ? "5px" : "5.5px", lineHeight: isCompact ? 1.3 : 1.5, ...bgStyle }}
    >
      {isCreative && (
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "linear-gradient(180deg, #0d9488, #2dd4bf, #06b6d4)" }} />
      )}
      {isImpact && (
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "#0d9488" }} />
      )}

      {isBold ? (
        <div className="-mx-3.5 -mt-3.5 mb-2 px-3.5 py-2" style={{ background: "#0f172a" }}>
          <div className="text-[10px] font-extrabold text-white">ALEX CHEN</div>
          <div className="text-[4.5px] font-semibold" style={{ color: "#2dd4bf" }}>Senior Product Manager</div>
          <div className="text-[3.5px] opacity-50 text-white">alex@email.com | SF, CA</div>
        </div>
      ) : (
        <div className={textAlign} style={{ marginLeft: isCreative ? "12px" : undefined }}>
          <div
            className={`font-bold ${isSwiss ? "text-[11px]" : "text-[8px]"}`}
            style={{
              color: isNoir ? "#fff" : pdfConfig.primaryColor === "#64748b" ? "#334155" : pdfConfig.primaryColor === "#0d9488" || pdfConfig.primaryColor === "#2dd4bf" ? "#0d9488" : pdfConfig.primaryColor,
              letterSpacing: templateKey === "minimal" ? "0.1em" : templateKey === "elegant" ? "0.08em" : undefined,
              textTransform: templateKey === "minimal" ? "uppercase" : undefined,
              fontWeight: isSwiss ? 900 : undefined,
            }}
          >
            ALEX CHEN
          </div>
          <div
            className="text-[4.5px]"
            style={{
              color: isNoir ? "#94a3b8" : isSwiss ? "#ef4444" : pdfConfig.mutedColor,
              fontStyle: isElegant ? "italic" : undefined,
              fontWeight: isSwiss ? 700 : undefined,
              textTransform: isSwiss ? "uppercase" : undefined,
              letterSpacing: isSwiss ? "0.1em" : undefined,
            }}
          >
            Senior Product Manager
          </div>
          <div className="text-[3.5px]" style={{ color: isNoir ? "#64748b" : "#94a3b8" }}>
            alex@email.com | SF, CA
          </div>
          {isElegant && <div className="mx-auto my-1 h-px w-6" style={{ background: "#0d9488" }} />}
        </div>
      )}

      {isMetric && (
        <div className="flex gap-1 my-1.5" style={{ marginLeft: isCreative ? "12px" : undefined }}>
          {[
            { num: "8+", label: "Years" },
            { num: "12", label: "Projects" },
            { num: "$2M", label: "Revenue" },
          ].map((m) => (
            <div key={m.label} className="flex-1 text-center rounded py-0.5" style={{
              background: templateKey === "data" ? "#eef2ff" : "#f0fdfa",
              border: templateKey === "data" ? "0.5px solid #a5b4fc" : "0.5px solid #99f6e4",
            }}>
              <div className="text-[7px] font-extrabold" style={{ color: templateKey === "data" ? "#4f46e5" : "#0d9488" }}>{m.num}</div>
              <div className="text-[3px]" style={{ color: "#64748b" }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {isPivot && (
        <div className="flex items-center gap-1 my-1.5" style={{ marginLeft: isCreative ? "12px" : undefined }}>
          <span className="px-1.5 py-0.5 rounded-full text-[4px] font-semibold" style={{ background: "#7c3aed20", color: "#7c3aed", border: "0.5px solid #7c3aed40" }}>Career Pivot</span>
          <div className="flex gap-0.5">
            {["Leadership", "Strategy", "Analytics"].map((s) => (
              <span key={s} className="px-1 py-px rounded text-[3px]" style={{ background: "#7c3aed15", color: "#7c3aed" }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginLeft: isCreative ? "12px" : undefined }}>
        <div
          className={`mt-1.5 mb-0.5 font-bold text-[4.5px] ${textAlign}`}
          style={{
            color: isNoir ? "#2dd4bf" : pdfConfig.primaryColor,
            borderBottom:
              pdfConfig.sectionDivider === "none"
                ? undefined
                : pdfConfig.sectionDivider === "dashed"
                  ? `1px dashed ${pdfConfig.primaryColor}`
                  : pdfConfig.sectionDivider === "thick"
                    ? `2px solid ${isNoir ? "#2dd4bf" : pdfConfig.secondaryColor}`
                    : `0.5px solid ${isNoir ? "#334155" : pdfConfig.primaryColor}`,
            paddingBottom: "1px",
            letterSpacing: templateKey === "elegant" || templateKey === "minimal" ? "0.1em" : undefined,
            background: isBold ? "#f1f5f9" : undefined,
            padding: isBold ? "1px 3px" : undefined,
          }}
        >
          {templateKey === "tech" ? "// Summary" : "Summary"}
        </div>
        <div className="rounded mb-0.5" style={{ background: isNoir ? "#1e293b" : pdfConfig.bgColor === "#fefce8" ? "#fef3c7" : "#e2e8f0", height: isCompact ? "2.5px" : "3px", width: "100%" }} />
        <div className="rounded mb-1" style={{ background: isNoir ? "#1e293b" : pdfConfig.bgColor === "#fefce8" ? "#fef3c7" : "#e2e8f0", height: isCompact ? "2.5px" : "3px", width: "85%" }} />

        <div
          className={`mt-1 mb-0.5 font-bold text-[4.5px] ${textAlign}`}
          style={{
            color: isNoir ? "#2dd4bf" : pdfConfig.primaryColor,
            borderBottom:
              pdfConfig.sectionDivider === "none"
                ? undefined
                : pdfConfig.sectionDivider === "dashed"
                  ? `1px dashed ${pdfConfig.primaryColor}`
                  : pdfConfig.sectionDivider === "thick"
                    ? `2px solid ${isNoir ? "#2dd4bf" : pdfConfig.secondaryColor}`
                    : `0.5px solid ${isNoir ? "#334155" : pdfConfig.primaryColor}`,
            paddingBottom: "1px",
            letterSpacing: templateKey === "elegant" || templateKey === "minimal" ? "0.1em" : undefined,
            background: isBold ? "#f1f5f9" : undefined,
            padding: isBold ? "1px 3px" : undefined,
          }}
        >
          {templateKey === "tech" ? "// Skills" : "Skills"}
        </div>

        <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isCentered ? "justify-center" : ""}`}>
          {["Product", "Agile", "SQL", "Python"].map((s) => {
            let pillStyle: React.CSSProperties = {};
            switch (pdfConfig.skillPillStyle) {
              case "filled":
                pillStyle = { background: isNoir ? "#1e293b" : pdfConfig.primaryColor, color: isNoir ? "#2dd4bf" : "#fff" };
                break;
              case "outlined":
                pillStyle = { background: "transparent", color: isNoir ? "#2dd4bf" : pdfConfig.primaryColor, border: `0.5px solid ${isNoir ? "#334155" : pdfConfig.primaryColor}` };
                break;
              case "dark":
                pillStyle = { background: "#0f172a", color: "#2dd4bf" };
                break;
              case "gradient":
                pillStyle = { background: "linear-gradient(135deg, #f0fdfa, #ecfeff)", color: "#0d9488", border: "0.5px solid #99f6e4" };
                break;
              case "text":
                pillStyle = { color: isNoir ? "#2dd4bf" : pdfConfig.mutedColor, fontStyle: isElegant ? "italic" : undefined };
                break;
            }
            return (
              <span key={s} className="px-1 py-px rounded text-[3.5px]" style={pillStyle}>{s}</span>
            );
          })}
        </div>

        <div
          className={`mt-1.5 mb-0.5 font-bold text-[4.5px] ${textAlign}`}
          style={{
            color: isNoir ? "#2dd4bf" : pdfConfig.primaryColor,
            borderBottom:
              pdfConfig.sectionDivider === "none"
                ? undefined
                : pdfConfig.sectionDivider === "dashed"
                  ? `1px dashed ${pdfConfig.primaryColor}`
                  : pdfConfig.sectionDivider === "thick"
                    ? `2px solid ${isNoir ? "#2dd4bf" : pdfConfig.secondaryColor}`
                    : `0.5px solid ${isNoir ? "#334155" : pdfConfig.primaryColor}`,
            paddingBottom: "1px",
            letterSpacing: templateKey === "elegant" || templateKey === "minimal" ? "0.1em" : undefined,
            background: isBold ? "#f1f5f9" : undefined,
            padding: isBold ? "1px 3px" : undefined,
          }}
        >
          {templateKey === "tech" ? "// Experience" : "Experience"}
        </div>
        <div className="font-semibold text-[4.5px]" style={{ color: isNoir ? "#e2e8f0" : pdfConfig.textColor }}>
          Product Manager — TechCorp
        </div>
        <div className="text-[3.5px] mb-0.5" style={{ color: isNoir ? "#64748b" : pdfConfig.mutedColor }}>
          2020 – Present
        </div>
        <div className="rounded mb-0.5" style={{ background: isNoir ? "#1e293b" : pdfConfig.bgColor === "#fefce8" ? "#fef3c7" : "#e2e8f0", height: isCompact ? "2.5px" : "3px", width: "90%" }} />
        <div className="rounded" style={{ background: isNoir ? "#1e293b" : pdfConfig.bgColor === "#fefce8" ? "#fef3c7" : "#e2e8f0", height: isCompact ? "2.5px" : "3px", width: "75%" }} />
      </div>
    </div>
  );
}

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: TemplateConfig;
  onClose: () => void;
  onUse: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[1100px] max-h-[90vh] grid grid-cols-1 md:grid-cols-[1fr_380px] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white p-10 overflow-y-auto min-h-[400px]">
          <div className="max-w-[500px] mx-auto">
            <div className="aspect-[8.5/11] w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <MiniResumePreview templateKey={template.key} />
            </div>
          </div>
        </div>

        <div className="p-8 border-l border-slate-700 flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-serif">{template.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{template.description}</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">ATS Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${template.atsScore}%`,
                    background: template.atsScore >= 90 ? "#10b981" : "#f59e0b",
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-200">{template.atsScore}%</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 capitalize">
                {template.category}
              </span>
              {template.industries.map((ind) => (
                <span key={ind} className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 capitalize">
                  {ind}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Features</p>
            <div className="flex flex-col gap-2">
              {template.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] mt-px" style={{ background: "rgba(13,148,136,0.15)", color: "#2dd4bf" }}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onUse}
            className="mt-auto w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            Use This Template
          </button>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/15 bg-white/5 text-white text-lg flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TemplateGallery({ selected, onSelect, compact }: TemplateGalleryProps) {
  const [styleFilter, setStyleFilter] = useState<StyleCategory | null>(null);
  const [industryFilter, setIndustryFilter] = useState<IndustryTag | null>(null);
  const [atsOnly, setAtsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateConfig | null>(null);

  const filtered = useMemo(() => {
    return TEMPLATE_KEYS.map((k) => TEMPLATE_CONFIGS[k]).filter((t) => {
      if (styleFilter && t.category !== styleFilter) return false;
      if (industryFilter && !t.industries.includes(industryFilter)) return false;
      if (atsOnly && t.atsScore < 90) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.includes(q) ||
          t.industries.some((i) => i.includes(q))
        );
      }
      return true;
    });
  }, [styleFilter, industryFilter, atsOnly, search]);

  const handleUseTemplate = useCallback(
    (key: TemplateKey) => {
      onSelect(key);
      setPreviewTemplate(null);
    },
    [onSelect],
  );

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setStyleFilter(null);
              setIndustryFilter(null);
              setAtsOnly(false);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              !styleFilter && !industryFilter && !atsOnly
                ? "bg-teal-900/40 border border-teal-600/40 text-teal-300"
                : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            All <span className="text-[10px] opacity-60 ml-0.5">{TEMPLATE_KEYS.length}</span>
          </button>

          <button
            onClick={() => setAtsOnly(!atsOnly)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              atsOnly
                ? "bg-emerald-900/40 border border-emerald-600/40 text-emerald-300"
                : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            ATS 90%+
          </button>

          <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

          {STYLE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setStyleFilter(styleFilter === cat.key ? null : cat.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                styleFilter === cat.key
                  ? cat.key === "career-pivot"
                    ? "bg-violet-900/40 border border-violet-600/40 text-violet-300"
                    : "bg-teal-900/40 border border-teal-600/40 text-teal-300"
                  : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300"
              }`}
            >
              {cat.label}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

          {INDUSTRY_TAGS.map((ind) => (
            <button
              key={ind.key}
              onClick={() => setIndustryFilter(industryFilter === ind.key ? null : ind.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                industryFilter === ind.key
                  ? "bg-teal-900/40 border border-teal-600/40 text-teal-300"
                  : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300"
              }`}
            >
              {ind.label}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-7 pr-3 py-1 w-36 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-600/50"
            />
          </div>
        </div>
      )}

      <div
        className={
          compact
            ? "grid grid-cols-2 sm:grid-cols-3 gap-2"
            : "grid gap-3"
        }
        style={
          compact
            ? undefined
            : { gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }
        }
      >
        {filtered.map((t) => (
          <div
            key={t.key}
            className={`group relative rounded-xl border overflow-hidden transition-all cursor-pointer ${
              selected === t.key
                ? "border-teal-500 ring-1 ring-teal-500/30 bg-slate-800/60"
                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
            }`}
            onClick={() => onSelect(t.key)}
          >
            <div className="relative" style={{ aspectRatio: "8.5 / 11" }}>
              <AtsBadge score={t.atsScore} />
              <MiniResumePreview templateKey={t.key} />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(t.key);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                >
                  Use Template
                </button>
                {!compact && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(t);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors backdrop-blur-sm border border-white/20 flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                )}
              </div>
            </div>

            <div className="p-3">
              <div className="text-sm font-semibold text-slate-100">{t.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</div>
              {!compact && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(13,148,136,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.2)" }}>
                    ATS {t.atsScore}%
                  </span>
                  {t.industries.map((ind) => (
                    <span key={ind} className="px-1.5 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-[10px] text-slate-400 capitalize">
                      {ind}
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-[10px] text-slate-400 capitalize">
                    {t.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-500">
          No templates match your filters. Try adjusting your criteria.
        </div>
      )}

      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => handleUseTemplate(previewTemplate.key)}
        />
      )}
    </div>
  );
}
