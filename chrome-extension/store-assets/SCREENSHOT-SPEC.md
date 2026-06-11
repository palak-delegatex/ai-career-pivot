# Chrome Web Store Screenshot Spec — 7 UX States

All screenshots should be **1280x800** (Chrome Web Store recommended).
Each screenshot should show the extension UI in context (within a browser chrome frame).

---

## Screenshot 1: Sign-In View (First Run)
**File:** `screenshot-01-sign-in.png`
**State:** `#signInView` visible
**Shows:** Empty state with user icon, "Sign in to start saving jobs" prompt, teal "Set Up Account" CTA.
**Caption:** "Get started in seconds — connect your AICareerPivot account"

## Screenshot 2: Default Dashboard (Pipeline + Recent Saves)
**File:** `screenshot-02-dashboard.png`
**State:** `#defaultView` visible, pipeline populated
**Shows:** Pipeline row (Saved → Applied → Interview → Offer) with sample counts, recent saves list with company icons and score rings, "Paste Job URL" button.
**Caption:** "Track your entire job search pipeline at a glance"

## Screenshot 3: Job Detected — ATS Score
**File:** `screenshot-03-ats-score.png`
**State:** `#jobView` visible with `#scoreSection` shown, `#saveCTA` visible
**Shows:** Job card (title, company, location, source badge), ATS score ring (e.g. 82), keyword/transferable/missing metrics, "Save & Track" CTA.
**Caption:** "Instant ATS match score when you view any job listing"

## Screenshot 4: Keyword Breakdown (Expanded)
**File:** `screenshot-04-keywords.png`
**State:** `#jobView` with `<details class="keyword-details">` open
**Shows:** Same as Screenshot 3 but with keyword breakdown expanded, showing matched tags (green) and missing tags (amber).
**Caption:** "See exactly which keywords match your resume and which are missing"

## Screenshot 5: Job Saved Confirmation
**File:** `screenshot-05-saved.png`
**State:** `#jobView` with `#savedCTA` visible (replaces save button)
**Shows:** Green "Saved" indicator with stage badge, "View in Tracker" and "Re-score" links.
**Caption:** "Save jobs with one click — syncs to your dashboard instantly"

## Screenshot 6: In-Page Save Button + Score Overlay
**File:** `screenshot-06-injected-ui.png`
**State:** Content script injected on a LinkedIn job listing
**Shows:** The `.acp-save-btn` pill injected near the job actions, plus the `.acp-score-panel` floating overlay with score ring, metrics, and keyword tags.
**Caption:** "Works right inside LinkedIn, Indeed, Glassdoor and more"

## Screenshot 7: Autofill Banner on Application Form
**File:** `screenshot-07-autofill.png`
**State:** Content script on Greenhouse/Lever application form
**Shows:** The `.acp-autofill-banner` at top with "Autofill" / "Skip" / "Never on this site" buttons, form fields highlighted with `.acp-field-highlight` teal outlines.
**Caption:** "One-click autofill on Greenhouse, Lever, Workday and Ashby"

---

## Production Notes

- **Viewport:** 1280x800 for all screenshots
- **Browser frame:** Include minimal Chrome browser chrome (address bar showing the relevant site URL) for context
- **Data:** Use realistic but synthetic job data (e.g. "Senior Product Designer at Stripe, San Francisco, CA")
- **Sensitive data:** No real user emails, names, or personally identifiable information
- **Ordering:** The 7 screenshots should be uploaded to the Chrome Web Store in this order, as it tells a coherent story from first run → daily usage
