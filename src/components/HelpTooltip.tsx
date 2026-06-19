"use client";

import { useCallback } from "react";
import { Popover } from "@base-ui/react/popover";
import { HelpCircle, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTooltipDismissed } from "@/lib/help-state";

interface HelpTooltipProps {
  tooltipId: string;
  title: string;
  body: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function HelpTooltip({
  tooltipId,
  title,
  body,
  learnMoreHref,
  learnMoreLabel = "Learn more",
  side = "top",
  className,
}: HelpTooltipProps) {
  const [dismissed, setDismissed] = useTooltipDismissed(tooltipId);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  if (dismissed) return null;

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={side} sideOffset={8}>
          <Popover.Popup className="z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between gap-2">
              <Popover.Title className="text-sm font-medium text-foreground">
                {title}
              </Popover.Title>
              <Popover.Close
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-3" />
              </Popover.Close>
            </div>
            <Popover.Description className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {body}
            </Popover.Description>
            <div className="mt-3 flex items-center justify-between">
              {learnMoreHref ? (
                <a
                  href={learnMoreHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {learnMoreLabel}
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span />
              )}
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Don&apos;t show again
              </button>
            </div>
            <Popover.Arrow className="fill-popover [&>path:first-child]:fill-border" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
