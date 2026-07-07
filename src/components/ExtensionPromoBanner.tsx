"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useExtensionDetected } from "@/hooks/use-extension-detected";
import {
  trackExtBannerShown,
  trackExtBannerDismissed,
  trackExtBannerCtaClicked,
} from "@/lib/tracking";

// Dashboard extension-adoption promo banner (AIC-758 / AIC-389 §1).
//
// Shows only when the extension is NOT detected (unknown or not-installed) and
// the user hasn't dismissed it in the last 30 days. Installed users never see it
// — detection suppresses the banner so we never nag people who already have it.
//
// Copy is fixed by the campaign spec (§1). Visual coordinates with the
// ChiefDesigner sibling issue; this ships functional on the dashboard's existing
// teal/dark theme and is mobile-safe at 375px.

const DISMISS_KEY = "ext_promo_dismissed_at";
const DISMISS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const PRIMARY_CTA_HREF =
  "/chrome-extension?utm_source=dashboard&utm_medium=banner&utm_campaign=ext_adoption";
const SECONDARY_HREF = "/chrome-extension";

// Pure predicate over the raw stored value (kept pure so the localStorage read
// can sit directly inside the setState call — mirrors ContextualHint).
function isDismissed(raw: string | null): boolean {
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < DISMISS_WINDOW_MS;
}

export function ExtensionPromoBanner() {
  const detection = useExtensionDetected();
  // Default to dismissed so the server (and the first client render) shows
  // nothing — the localStorage read below flips it on the client, avoiding a
  // hydration mismatch. Same pattern as ContextualHint.
  const [dismissed, setDismissed] = useState(true);
  const trackedRef = useRef(false);

  useEffect(() => {
    setDismissed(isDismissed(localStorage.getItem(DISMISS_KEY)));
  }, []);

  const visible = detection !== "installed" && !dismissed;

  useEffect(() => {
    if (visible && !trackedRef.current) {
      trackedRef.current = true;
      trackExtBannerShown({ detection: detection as "not-installed" | "unknown" });
    }
  }, [visible, detection]);

  if (!visible) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore storage failures — banner just re-shows next load */
    }
    setDismissed(true);
    trackExtBannerDismissed();
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/80 to-slate-900 p-5 sm:p-6">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center sm:justify-between sm:pr-8">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
            Chrome extension
          </div>
          <h3 className="text-base font-bold text-slate-100 sm:text-lg">
            Save any job in one click — and get an instant ATS score
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Add the AICareerPivot extension to score your resume against any
            LinkedIn, Indeed, or Greenhouse posting without leaving the page.
            Your saved jobs sync straight to this dashboard.
          </p>
          <a
            href={SECONDARY_HREF}
            onClick={() => trackExtBannerCtaClicked({ cta: "secondary" })}
            className="mt-2 inline-block text-sm font-medium text-teal-400 underline-offset-2 hover:underline"
          >
            See how it works →
          </a>
        </div>

        <a
          href={PRIMARY_CTA_HREF}
          onClick={() => trackExtBannerCtaClicked({ cta: "primary" })}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition-colors hover:bg-teal-500"
        >
          Add to Chrome — Free
        </a>
      </div>
    </div>
  );
}
