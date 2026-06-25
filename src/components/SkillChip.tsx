"use client";

export type SkillStatus = "matched" | "missing" | "partial" | "added";
export type SkillType = "hard" | "soft" | "other";

const statusStyles: Record<SkillStatus, string> = {
  matched: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400",
  missing: "bg-red-400/[0.08] border-red-400/20 text-red-400 hover:bg-red-400/15 cursor-pointer",
  partial: "bg-amber-400/10 border-amber-400/25 text-amber-400",
  added: "bg-emerald-400/15 border-emerald-400/35 text-emerald-400 animate-[chip-pop_300ms_ease-out]",
};

const statusIcon: Record<SkillStatus, string> = {
  matched: "✓",
  missing: "✗",
  partial: "~",
  added: "✓",
};

export function SkillChip({
  keyword,
  status,
  skillType,
  onAdd,
}: {
  keyword: string;
  status: SkillStatus;
  skillType: SkillType;
  onAdd?: () => void;
}) {
  const handleClick = () => {
    if (status === "missing" && onAdd) onAdd();
  };

  return (
    <span
      role={status === "missing" ? "button" : undefined}
      tabIndex={status === "missing" ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (status === "missing" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${statusStyles[status]} ${status === "missing" ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500" : ""}`}
    >
      {status === "missing" ? (
        <>
          <span className="text-[10px] group-hover:hidden">{statusIcon[status]}</span>
          <span className="hidden text-[10px] group-hover:inline">+</span>
        </>
      ) : (
        <span className="text-[10px]">{statusIcon[status]}</span>
      )}
      {keyword}
      {status === "added" && (
        <span className="text-[9px] opacity-70">(added)</span>
      )}
    </span>
  );
}
