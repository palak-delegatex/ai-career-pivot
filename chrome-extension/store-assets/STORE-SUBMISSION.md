# Chrome Web Store Submission — AICareerPivot Job Saver

Everything the submitter needs to paste into the Web Store developer dashboard.
Screenshots and promo tiles are in this folder. The only thing NOT in this repo
is the **store account + $5 developer registration fee** — see "Publish gate".

---

## 1. Listing basics

| Field | Value |
|---|---|
| **Name** | AICareerPivot — Job Saver & ATS Score |
| **Summary** (≤132 chars) | Save jobs from LinkedIn, Indeed, Glassdoor & 8 ATS platforms. Get instant ATS match scores and autofill applications. |
| **Category** | Productivity |
| **Language** | English |

## 2. Detailed description (paste as-is)

```
Stop losing track of jobs and guessing whether your resume will pass the ATS.

AICareerPivot lives on the job boards and ATS platforms you already use and turns
every listing into one click:

• SAVE ANY JOB — LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever,
  Workday, Ashby, iCIMS, Taleo/Oracle. One button, saved to your account.

• INSTANT ATS MATCH SCORE — See how well your profile matches the job description
  before you apply, with the exact keywords you're missing.

• AUTOFILL APPLICATIONS — Fill Greenhouse, Lever, Workday, Ashby and more from your
  saved profile so you spend seconds, not minutes, per application.

• EVERYTHING SYNCS TO THE WEB — Saved jobs and scores flow straight into your
  AICareerPivot dashboard, so your pipeline is one organized job tracker instead of
  40 open tabs.

• LINKEDIN PROFILE OPTIMIZER — Get keyword suggestions to make your profile
  recruiter-ready.

Sign in with Google, and your captures land in your account instantly. Free to
install. Built for career pivoters who want to apply smarter, not harder.
```

## 3. Single-purpose statement (required)

```
This extension helps job seekers capture job postings and evaluate how well their
profile matches each posting. It saves listings from supported job boards and ATS
platforms to the user's AICareerPivot account, computes an ATS keyword-match score,
and can autofill application forms from the user's saved profile.
```

## 4. Permission justifications (required — one per permission)

| Permission | Justification (paste into the form) |
|---|---|
| `storage` | Persist the user's session token and cached profile locally so the extension works across page loads without re-authenticating. |
| `activeTab` | Read the job posting on the tab the user explicitly acts on (clicks Save / Score) to extract role, company and description. |
| `scripting` | Inject the Save/Score button and autofill UI into supported job-board and application pages. |
| `identity` | Complete Google OAuth sign-in via `chrome.identity.launchWebAuthFlow` so captures sync to the user's account. No password is ever handled by the extension. |
| `alarms` | Refresh the auth token before it expires so the user stays signed in without interruption. |
| **Host permissions** (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Ashby, iCIMS, Taleo, Oracle Cloud) | Detect job postings and application forms on these specific platforms to place the Save/Score button and run autofill. The extension only reads page content on these job-board domains. |
| `ai-career-pivot.vercel.app`, `*.supabase.co` | Sync saved jobs, scores and profile to the user's own AICareerPivot account. |

## 5. Data-use disclosures (Privacy practices tab)

- **What is collected:** account email (via Google sign-in), job postings the user
  chooses to save (title, company, URL, description), and the user's profile/skills
  they enter to compute match scores.
- **How it's used:** solely to provide the job-tracking, scoring and autofill
  features in the user's own account. **Not sold. Not used for advertising. Not
  shared with third parties** beyond the app's own backend (Supabase).
- **Certifications to check in the form:** ✅ not sold to third parties ✅ not used
  for unrelated purposes ✅ not used for creditworthiness/lending.
- **Privacy policy URL:** https://ai-career-pivot.vercel.app/privacy  *(confirm this
  route exists and is reachable before submitting — see checklist)*

## 6. Assets in this folder

- `screenshot-01`…`screenshot-07` (1280×800) — 5 required max; pick the 5 strongest
  (recommend: 03-ats-score, 06-injected-ui, 07-autofill, 02-dashboard, 05-saved).
- `promo-small-440x280.png` — small promo tile (required).
- `promo-marquee-1400x560.png` — marquee (optional, for featuring).
- `promo-large-920x680.png` — large promo (optional).
- Icons: `../icons/icon-128.png` is the store icon.

## 7. Pre-submit checklist

- [ ] Bump `manifest.json` version if re-submitting after a rejection.
- [ ] Confirm `https://ai-career-pivot.vercel.app/privacy` returns 200 (Web Store
      rejects listings whose privacy URL 404s).
- [ ] Build the package: run `bash chrome-extension/package.sh`. It produces
      `chrome-extension/dist/aicareerpivot-extension-v<version>.zip` with the
      correct contents (`__tests__/` and `store-assets/` are excluded
      automatically — do **not** hand-zip). Upload *this* file.
- [ ] **Google OAuth redirect — do this as part of the upload, in order:**
  1. In the developer dashboard, click **Add new item** and upload the zip. The
     dashboard shows the **assigned extension ID immediately, as a draft — you do
     NOT need to publish first to see it.**
  2. Copy that ID and add `https://<EXTENSION_ID>.chromiumapp.org/` to
     Supabase → Auth → URL Configuration → **Redirect URLs**.
  3. *Then* fill sections 1–6 and click **Publish**. Doing it in this order means
     Google sign-in works the instant the listing goes live — no post-publish
     breakage window.
  - ⚠️ Do **NOT** add a `key` field to `manifest.json` to try to pin the ID.
    Chrome assigns the ID from its own key on first upload and **rejects** a
    first submission that contains a `key` field. The ID cannot be chosen in
    advance; the draft-upload step above is how you learn it. (`key` is only for
    keeping a stable ID across *local* dev loads, and for re-uploads after the
    first publish.)

## 8. Publish gate — needs CEO / board

The extension code and assets are submission-ready. Publishing requires:

1. A **Chrome Web Store developer account** ($5 one-time registration) under a
   company Google account.
2. Someone with that account to upload the zip, paste sections 1–6 above, and
   submit for review.

This is a credentials/account action, not an engineering task — escalated to CEO.
