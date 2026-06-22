"use client";

import { useState, useEffect, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFabPulseShown } from "@/lib/help-state";
import { HelpPanel } from "@/components/HelpPanel";
import { useCareerCoach } from "@/components/CareerCoachContext";

export function HelpFAB() {
  const { widgetActive } = useCareerCoach();
  const [open, setOpen] = useState(false);
  const [pulseShown, setPulseShown] = useFabPulseShown();
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (!pulseShown) {
      setShouldPulse(true);
      const timer = setTimeout(() => {
        setPulseShown(true);
        setShouldPulse(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [pulseShown, setPulseShown]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Open help"
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full",
          widgetActive ? "left-6" : "right-6",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-transform hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          shouldPulse && "help-fab-pulse"
        )}
      >
        <HelpCircle className="size-6" />
      </button>
      <HelpPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
