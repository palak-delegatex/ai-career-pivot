"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, ChevronRight, ExternalLink, Copy, Check } from "lucide-react";
import { trackWarmIntroShareOpened, trackWarmIntroShared } from "@/lib/tracking";

// Shareable artifact — a screenshot-worthy card (viral lever, no paywall).
// Follows the ShareableProgressCard visual pattern. Rendered inside a Radix
// Dialog for focus trapping.
export default function WarmIntroShareCard({
  company,
  contactRole,
  mutualName,
  jobId,
}: {
  company: string;
  contactRole: string;
  mutualName: string | null;
  jobId: string;
}) {
  const [copied, setCopied] = useState(false);
  const ctx = { company, job_id: jobId };

  const shareLink = "https://ai-career-pivot.com/?utm_source=warm_intro_share";
  const shareText =
    "Referrals make you 4x more likely to get hired. AI just found mine in seconds.";

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) trackWarmIntroShareOpened(ctx);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company, jobId],
  );

  const shareLinkedIn = useCallback(() => {
    trackWarmIntroShared({ ...ctx, channel: "linkedin" });
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=600",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, jobId]);

  const shareX = useCallback(() => {
    trackWarmIntroShared({ ...ctx, channel: "x" });
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=600",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, jobId]);

  const shareCopy = useCallback(() => {
    trackWarmIntroShared({ ...ctx, channel: "copy" });
    navigator.clipboard?.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, jobId]);

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-400 hover:text-teal-300 transition-colors"
        aria-label="Share that you found a warm intro"
      >
        <Share2 className="h-3 w-3" />
        Share this win
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-teal-800/30">
        <DialogHeader className="sr-only">
          <DialogTitle>Share your warm intro</DialogTitle>
        </DialogHeader>

        {/* Gradient share card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 p-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />

          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-3">
            AICareerPivot
          </p>
          <h3 className="text-xl font-extrabold text-white leading-tight">
            I found my warm intro to a hiring manager at{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {company}
            </span>
          </h3>

          {/* Connection path visualization */}
          <div className="flex items-center justify-center gap-3 my-5">
            <PathNode label="Me" />
            {mutualName && (
              <>
                <ChevronRight className="h-4 w-4 text-teal-600" />
                <PathNode label={mutualName.split(" ")[0]} />
              </>
            )}
            <ChevronRight className="h-4 w-4 text-teal-600" />
            <PathNode label={contactRole} highlight />
          </div>

          <p className="text-[13px] text-slate-400 italic text-center max-w-[280px] mx-auto">
            &ldquo;Referrals make you 4x more likely to get hired. AI just found
            mine in seconds.&rdquo;
          </p>
        </div>

        {/* Share actions */}
        <div className="flex items-center justify-center gap-2 px-6 pb-6">
          <button
            onClick={shareLinkedIn}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a66c2] hover:bg-[#0955a5] text-white text-sm font-semibold transition-colors"
            aria-label="Share on LinkedIn"
          >
            <ExternalLink className="h-4 w-4" /> LinkedIn
          </button>
          <button
            onClick={shareX}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            aria-label="Share on X"
          >
            𝕏 Post
          </button>
          <button
            onClick={shareCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
            aria-label="Copy share link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PathNode({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 max-w-[90px]">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold ${
          highlight
            ? "bg-gradient-to-br from-teal-500 to-emerald-500"
            : "bg-white/[0.08] border border-white/[0.12]"
        }`}
      >
        {label.charAt(0).toUpperCase()}
      </div>
      <span className="text-[9px] text-slate-500 text-center leading-tight truncate max-w-[80px]">
        {label}
      </span>
    </div>
  );
}
