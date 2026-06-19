"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const KEYS = {
  tourCompleted: (featureId: string) => `help:tour:${featureId}:completed`,
  welcomeDismissed: (featureId: string) => `help:welcome:${featureId}:dismissed`,
  tooltipDismissed: (tooltipId: string) => `help:tooltip:${tooltipId}:dismissed`,
  nudgeDismissed: (nudgeType: string) => `help:nudge:${nudgeType}:dismissed`,
  fabPulseShown: "help:fab:pulse:shown",
} as const;

function getItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function setItem(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(key, "true");
  } else {
    localStorage.removeItem(key);
  }
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

let listeners: Set<() => void> = new Set();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const handler = () => cb();
  window.addEventListener("storage", handler);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", handler);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export function useHelpDismissed(key: string): [boolean, (v?: boolean) => void] {
  const [dismissed, setDismissed] = useState(() => getItem(key));

  useEffect(() => {
    setDismissed(getItem(key));
    const handler = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        setDismissed(getItem(key));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  const toggle = useCallback(
    (value: boolean = true) => {
      setItem(key, value);
      setDismissed(value);
      notifyListeners();
    },
    [key]
  );

  return [dismissed, toggle];
}

export function useTourCompleted(featureId: string) {
  return useHelpDismissed(KEYS.tourCompleted(featureId));
}

export function useWelcomeDismissed(featureId: string) {
  return useHelpDismissed(KEYS.welcomeDismissed(featureId));
}

export function useTooltipDismissed(tooltipId: string) {
  return useHelpDismissed(KEYS.tooltipDismissed(tooltipId));
}

export function useNudgeDismissed(nudgeType: string) {
  return useHelpDismissed(KEYS.nudgeDismissed(nudgeType));
}

export function useFabPulseShown() {
  return useHelpDismissed(KEYS.fabPulseShown);
}

export { KEYS as HELP_KEYS };
