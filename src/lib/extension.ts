/**
 * Single source of truth for Chrome extension marketing links (AIC-388).
 *
 * The MV3 extension is submission-ready but not yet published — publishing is
 * gated on a Chrome Web Store developer account ($5 registration) tracked in
 * AIC-755. Until it goes live, `EXTENSION_PUBLISHED` stays false so the
 * /chrome-extension landing page shows a "coming soon" state instead of a dead
 * "Add to Chrome" link.
 *
 * POST-PUBLISH FLIP (AIC-755 follow-up): once the listing is live, set
 * `EXTENSION_PUBLISHED = true` and replace `CHROME_STORE_URL` with the real
 * listing URL (the published extension ID differs from the dev ID). That single
 * change turns the Install CTA on across the marketing page.
 */
export const EXTENSION_PUBLISHED = false;

/** Chrome Web Store listing URL. Placeholder slug until AIC-755 publishes. */
export const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/aicareerpivot";
