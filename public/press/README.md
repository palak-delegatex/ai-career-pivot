# Press / marketing screenshots

Real product-UI screenshots of **AICareerPivot** for the Product Hunt listing
(reusable on `/pricing` and social). Captured from the live app at
`https://ai-career-pivot.vercel.app` on 2026-07-08. See AIC-782.

Each screen has two frames:
- `*-1270x760.png` — cropped to the Product Hunt gallery viewport (1270×760).
- `*-full.png` — full-page source frame (crop/reframe as needed).

| File | Screen | Source |
|------|--------|--------|
| `01-hero-*` | Landing / hero | Live app `/` |
| `02-how-it-works-*` | How it works | Live app `/how-it-works` |
| `03-pricing-*` | Pricing | Live app `/pricing` |
| `04-roadmap-output-*` | AI career pivot roadmap (report output) | Real report UI, seeded demo data (see note) |
| `05-roadmap-plan2-full` | Roadmap — second target-role plan tab | Same as above, second plan selected |

## Note on the roadmap frames (04, 05)

The live `/report/[id]` page reads each report from a Supabase table that is
locked to `service_role` (RLS), and there is no service-role key in the local
environment. So the roadmap could not be pulled from a live report id without
either that key or running the full paid onboarding + LLM generation flow.

To still deliver the roadmap frame, the **real** report components
(`src/app/report/[id]/ReportContent.tsx` + the report page markup) were rendered
locally against a seeded, fictional, non-PII persona ("Elena Ramirez", a teacher
pivoting into instructional design). Pixels are the genuine product UI; only the
data is a fixture. The temporary demo route used for capture was removed after
the shots were taken — it is not part of the app.

If a listing-accurate roadmap from a genuine generated report is required,
provide a `SUPABASE_SERVICE_ROLE_KEY` (or a real report id) and the frame can be
re-shot from live data.

## Demo data personas contain no real user data / PII.
