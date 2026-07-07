import { useState, useEffect } from "react";

// Extension detection (AIC-758 / AIC-389 §2).
//
// The AICareerPivot Chrome extension injects a content script on our web-app
// domains (see chrome-extension `content/site-flag.js`) that stamps
// `document.documentElement.dataset.aicpExtension = <version>` at document_start.
// This hook reads that flag so the dashboard promo banner can suppress itself
// for users who already have the extension.
//
// We picked the content-script DOM-flag approach (spec §2 option B) over
// `externally_connectable` (option A) because it needs no stable/published
// extension ID — the extension isn't in the Web Store under a fixed key yet —
// and it works identically across ai-career-pivot.com and preview domains.
//
// Returns:
//   "installed"     — flag present, extension confirmed
//   "not-installed" — flag absent after the detection window elapsed
//   "unknown"       — still within the detection window (initial state)
//
// The banner shows on both "not-installed" and "unknown" (better to over-show
// to a non-installer than to hide from one). We only need to be confident about
// the "installed" case, and that resolves as soon as the flag is seen.

export type ExtensionDetection = "installed" | "not-installed" | "unknown";

const FLAG_ATTR = "aicpExtension";
const DETECTION_WINDOW_MS = 500;
const POLL_INTERVAL_MS = 50;

function readFlag(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.documentElement.dataset[FLAG_ATTR]);
}

export function useExtensionDetected(): ExtensionDetection {
  const [status, setStatus] = useState<ExtensionDetection>(() =>
    readFlag() ? "installed" : "unknown"
  );

  useEffect(() => {
    if (readFlag()) {
      setStatus("installed");
      return;
    }

    // The content script runs at document_start but React can mount first, so
    // poll for the flag over a short window before concluding "not-installed".
    let elapsed = 0;
    const timer = setInterval(() => {
      if (readFlag()) {
        setStatus("installed");
        clearInterval(timer);
        return;
      }
      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= DETECTION_WINDOW_MS) {
        setStatus("not-installed");
        clearInterval(timer);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return status;
}
