"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wrench, Users, Search, Eye, FileText, Lightbulb, ChevronUp } from "lucide-react";
import { BeforeAfterScoreRing } from "@/components/BeforeAfterScoreRing";
import { CategoryBreakdownBar } from "@/components/CategoryBreakdownBar";
import { SuggestionCard, type SuggestionStatus, type SuggestionChange } from "@/components/SuggestionCard";
import { SkillChip, type SkillStatus } from "@/components/SkillChip";
import type { TailorResponse } from "@/app/api/resume/tailor/route";
import type { CategoryScore, KeywordMatch } from "@/lib/ats-scoring";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hard_skills: <Wrench className="h-3.5 w-3.5" />,
  soft_skills: <Users className="h-3.5 w-3.5" />,
  keyword_density: <Search className="h-3.5 w-3.5" />,
  searchability: <Eye className="h-3.5 w-3.5" />,
  formatting: <FileText className="h-3.5 w-3.5" />,
  recruiter_tips: <Lightbulb className="h-3.5 w-3.5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  hard_skills: "Hard Skills",
  soft_skills: "Soft Skills",
  keyword_density: "Keyword Density",
  searchability: "Searchability",
  formatting: "Formatting",
  recruiter_tips: "Recruiter Tips",
};

interface OptimizerLayoutProps {
  tailorResult: TailorResponse;
  beforeCategories: CategoryScore[];
  afterCategories: CategoryScore[];
  keywordMatches: KeywordMatch[];
  resumeContent: string;
  onApplyChanges: (acceptedChanges: SuggestionChange[]) => void;
}

export function OptimizerLayout({
  tailorResult,
  beforeCategories,
  afterCategories,
  keywordMatches,
  resumeContent,
  onApplyChanges,
}: OptimizerLayoutProps) {
  const [statuses, setStatuses] = useState<SuggestionStatus[]>(
    () => tailorResult.changes.map(() => "pending")
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const handleAccept = useCallback((i: number) => {
    setStatuses((prev) => prev.map((s, idx) => (idx === i ? "accepted" : s)));
  }, []);

  const handleReject = useCallback((i: number) => {
    setStatuses((prev) => prev.map((s, idx) => (idx === i ? "rejected" : s)));
  }, []);

  const handleAcceptAll = useCallback(() => {
    setStatuses((prev) => prev.map((s) => (s === "pending" ? "accepted" : s)));
  }, []);

  const acceptedCount = statuses.filter((s) => s === "accepted").length;
  const totalCount = statuses.length;
  const acceptedPct = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  const acceptedChanges = useMemo(
    () => tailorResult.changes.filter((_, i) => statuses[i] === "accepted"),
    [tailorResult.changes, statuses]
  );

  const currentAfterScore = useMemo(() => {
    if (acceptedCount === totalCount) return tailorResult.tailoredScore.score;
    if (acceptedCount === 0) return tailorResult.originalScore.score;
    const delta = tailorResult.tailoredScore.score - tailorResult.originalScore.score;
    const ratio = acceptedCount / totalCount;
    return Math.round(tailorResult.originalScore.score + delta * ratio);
  }, [acceptedCount, totalCount, tailorResult]);

  const impactPerChange = useMemo(() => {
    const totalDelta = tailorResult.tailoredScore.score - tailorResult.originalScore.score;
    const base = totalCount > 0 ? totalDelta / totalCount : 0;
    return tailorResult.changes.map((_, i) => Math.max(1, Math.round(base + (i === 0 ? 1 : 0))));
  }, [tailorResult, totalCount]);

  const skillGroups = useMemo(() => {
    const hard: { keyword: string; status: SkillStatus }[] = [];
    const soft: { keyword: string; status: SkillStatus }[] = [];
    const other: { keyword: string; status: SkillStatus }[] = [];

    for (const km of keywordMatches) {
      const status: SkillStatus = km.matched
        ? km.matchType === "variant" || km.matchType === "semantic"
          ? "partial"
          : "matched"
        : "missing";

      const entry = { keyword: km.keyword, status };
      if (km.skillType === "hard") hard.push(entry);
      else if (km.skillType === "soft") soft.push(entry);
      else other.push(entry);
    }

    return { hard, soft, other };
  }, [keywordMatches]);

  const hardMatched = skillGroups.hard.filter((s) => s.status !== "missing").length;
  const softMatched = skillGroups.soft.filter((s) => s.status !== "missing").length;
  const otherMatched = skillGroups.other.filter((s) => s.status !== "missing").length;

  const scorePanel = (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Compact score header */}
      <div className="flex items-center gap-4 border-b border-slate-700 p-5">
        <BeforeAfterScoreRing
          beforeScore={tailorResult.originalScore.score}
          afterScore={currentAfterScore}
          size={80}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="breakdown" className="flex flex-1 flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-700 bg-transparent p-0">
          <TabsTrigger
            value="breakdown"
            className="flex-1 rounded-none border-b-2 border-transparent py-3 text-[11px] font-semibold data-[state=active]:border-teal-400 data-[state=active]:bg-transparent data-[state=active]:text-teal-400"
          >
            Breakdown
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="flex-1 rounded-none border-b-2 border-transparent py-3 text-[11px] font-semibold data-[state=active]:border-teal-400 data-[state=active]:bg-transparent data-[state=active]:text-teal-400"
          >
            Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="flex-1 rounded-none border-b-2 border-transparent py-3 text-[11px] font-semibold data-[state=active]:border-teal-400 data-[state=active]:bg-transparent data-[state=active]:text-teal-400"
          >
            Skills
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Breakdown tab */}
          <TabsContent value="breakdown" className="m-0 p-4">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">Score Breakdown</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-sm bg-slate-600" /> Before
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" /> After
                </span>
              </div>
            </div>
            {beforeCategories.map((cat, i) => {
              const afterCat = afterCategories.find((c) => c.key === cat.key);
              return (
                <CategoryBreakdownBar
                  key={cat.key}
                  name={CATEGORY_LABELS[cat.key] || cat.name}
                  icon={CATEGORY_ICONS[cat.key]}
                  beforeScore={Math.round(cat.score)}
                  afterScore={Math.round(afterCat?.score ?? cat.score)}
                  weight={cat.weight}
                />
              );
            })}
          </TabsContent>

          {/* Suggestions tab */}
          <TabsContent value="suggestions" className="m-0 p-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-200">AI Suggestions</span>
                <span className="ml-2 text-[11px] text-slate-400">
                  — <strong className="text-emerald-400">{acceptedCount}</strong> of {totalCount} accepted
                </span>
              </div>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg border border-teal-400/25 bg-teal-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-teal-400 transition-colors hover:bg-teal-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Accept All
              </button>
            </div>
            {tailorResult.changes.map((change, i) => (
              <SuggestionCard
                key={i}
                change={change}
                impact={impactPerChange[i]}
                status={statuses[i]}
                onAccept={() => handleAccept(i)}
                onReject={() => handleReject(i)}
              />
            ))}

            {/* Progress strip */}
            <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-800 border border-slate-700 p-4">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-slate-400">{acceptedCount} of {totalCount} suggestions accepted</span>
                  <span className="font-bold text-teal-400">{acceptedPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${acceptedPct}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => onApplyChanges(acceptedChanges)}
                disabled={acceptedCount === 0}
                className="whitespace-nowrap rounded-lg bg-teal-600 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Apply Changes
              </button>
            </div>
          </TabsContent>

          {/* Skills tab */}
          <TabsContent value="skills" className="m-0 p-4">
            {/* Hard skills */}
            {skillGroups.hard.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-300">
                    <Wrench className="h-3.5 w-3.5" /> Hard Skills
                    <span className="text-[10px] font-normal text-slate-500">(Required)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">{hardMatched}/{skillGroups.hard.length} matched</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGroups.hard.map((s) => (
                    <SkillChip key={s.keyword} keyword={s.keyword} status={s.status} skillType="hard" />
                  ))}
                </div>
              </div>
            )}

            {/* Soft skills */}
            {skillGroups.soft.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-300">
                    <Users className="h-3.5 w-3.5" /> Soft Skills
                    <span className="text-[10px] font-normal text-slate-500">(Preferred)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">{softMatched}/{skillGroups.soft.length} matched</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGroups.soft.map((s) => (
                    <SkillChip key={s.keyword} keyword={s.keyword} status={s.status} skillType="soft" />
                  ))}
                </div>
              </div>
            )}

            {/* JD Keywords */}
            {skillGroups.other.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-300">
                    <Search className="h-3.5 w-3.5" /> JD Keywords
                  </span>
                  <span className="text-[10px] text-teal-400">{otherMatched}/{skillGroups.other.length} matched</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGroups.other.map((s) => (
                    <SkillChip key={s.keyword} keyword={s.keyword} status={s.status} skillType="other" />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );

  const resumeSections = useMemo(() => {
    const lines = resumeContent.split("\n");
    const sections: { heading: string; content: string }[] = [];
    let current = { heading: "Resume", content: "" };

    for (const line of lines) {
      if (line.startsWith("## ") || line.startsWith("# ")) {
        if (current.content.trim()) sections.push(current);
        current = { heading: line.replace(/^#+\s*/, ""), content: "" };
      } else {
        current.content += line + "\n";
      }
    }
    if (current.content.trim()) sections.push(current);
    return sections;
  }, [resumeContent]);

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden min-h-[800px] min-[900px]:flex">
        {/* Left panel: resume content */}
        <div className="flex flex-1 flex-col border-r border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/60 px-5 py-4">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
              <FileText className="h-4 w-4" /> Resume Content
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live Preview
            </span>
          </div>
          <ScrollArea className="flex-1 p-6">
            {resumeSections.map((section, i) => (
              <div key={i} className="mb-6">
                <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-sm font-bold uppercase tracking-wide text-slate-200">
                    {section.heading}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-400">
                  {section.content.trim()}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Right panel: score panel */}
        <div className="w-[380px]">{scorePanel}</div>
      </div>

      {/* Mobile layout */}
      <div className="min-[900px]:hidden">
        {/* Resume content */}
        <div className="p-4">
          {resumeSections.map((section, i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 border-b border-slate-700 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-200">
                  {section.heading}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                {section.content.trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Floating score button */}
        <button
          onClick={() => setMobileSheetOpen(true)}
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-teal-400/30 bg-slate-900 px-5 py-3 text-sm font-semibold text-teal-400 shadow-lg shadow-black/40"
        >
          <ChevronUp className="h-4 w-4" />
          Score: {currentAfterScore}%
          {acceptedCount > 0 && (
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-400">
              +{currentAfterScore - tailorResult.originalScore.score}
            </span>
          )}
        </button>

        {/* Bottom sheet */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] rounded-t-2xl border-t border-slate-700 bg-slate-900 p-0">
            {scorePanel}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
