"use client";

import { useCallback, type ReactNode } from "react";
import { Sparkles, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeDismissed } from "@/lib/help-state";

interface WelcomeStep {
  icon: ReactNode;
  text: string;
}

interface FeatureWelcomeProps {
  featureId: string;
  title: string;
  subtitle?: string;
  steps: WelcomeStep[];
  onTakeTour?: () => void;
  className?: string;
}

export function FeatureWelcome({
  featureId,
  title,
  subtitle,
  steps,
  onTakeTour,
  className,
}: FeatureWelcomeProps) {
  const [dismissed, setDismissed] = useWelcomeDismissed(featureId);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  const handleTakeTour = useCallback(() => {
    setDismissed(true);
    onTakeTour?.();
  }, [setDismissed, onTakeTour]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "welcome-banner relative overflow-hidden rounded-xl border border-primary/20 p-5",
        "bg-gradient-to-br from-primary/10 via-accent/5 to-transparent",
        className
      )}
      role="region"
      aria-label={`Welcome to ${title}`}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss welcome banner"
      >
        <X className="size-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="text-base font-medium text-foreground">{title}</h3>
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}

      {/* Steps */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/50 p-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xs font-medium">{i + 1}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 text-muted-foreground">
                {step.icon}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {step.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        {onTakeTour && (
          <Button
            variant="default"
            size="sm"
            onClick={handleTakeTour}
            className="gap-1.5"
          >
            <PlayCircle className="size-3.5" />
            Take a quick tour
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Skip
        </Button>
      </div>
    </div>
  );
}
