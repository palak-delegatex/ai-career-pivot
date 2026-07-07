// Extension detection flag for the AICareerPivot web app (AIC-758 / AIC-389 §2).
//
// Runs on the AICareerPivot web-app domains at document_start and stamps the
// installed extension's version onto the document root. The web app's
// `useExtensionDetected()` hook reads `document.documentElement.dataset.aicpExtension`
// to suppress the dashboard install-promo banner for users who already have the
// extension.
//
// We use the DOM-flag approach (spec §2 option B) rather than
// `externally_connectable` so detection needs no stable/published extension ID.
(() => {
  try {
    const version = chrome.runtime.getManifest().version;
    document.documentElement.dataset.aicpExtension = version;
  } catch {
    // If the manifest isn't reachable for any reason, still signal presence.
    document.documentElement.dataset.aicpExtension = "1";
  }
})();
