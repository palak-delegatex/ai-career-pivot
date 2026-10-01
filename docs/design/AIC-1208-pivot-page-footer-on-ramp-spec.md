# AIC-1208 — /pivot page footer on-ramp spec

Status: correction implemented for review in AIC-1283; production verification pending.
This reconstructs the shipped inline module and corrects its unsupported promises.

## Actual behavior

The inline on-ramp in `src/app/[locale]/pivot/[slug]/page.tsx` sits between
the article and FAQ. It uses canonical role labels for navigation context.
The readiness tool asks five questions and calculates a general 0–100 score
in the browser across experience, motivation, commitment, and timeline.
It does not analyze a resume, assess role fit, identify role-specific skill
gaps, or generate a weekly plan. BLS and Claude are not involved in this score.

## Module copy

- Eyebrow: “Explore your next step”
- Heading: “Considering a move from {fromRole} to {toRole}?”
- Description: “Answer five questions about your career stage, AI exposure,
  motivation, available time, and timeline. Get a general AI career readiness
  score and a breakdown across four dimensions.”
- Preview: “A general readiness score from 0 to 100”; “Your experience,
  motivation, time commitment, and timeline breakdown”; “A summary of your
  strongest area and an area to build next”.
- CTA: “Check your readiness — free →”
- Reassurance: “Free. No account required. Results calculated in your browser.”
- Shared article CTA: “Check your general AI career readiness with five questions
  about your experience, motivation, available time, and timeline. This assessment
  does not evaluate fit for a specific role.”
- Keep “free →” together when the CTA label wraps on mobile.

## Context and compatibility

The locale-aware CTA encodes canonical `from` and `to` slugs in the readiness
query. The destination accepts only a single source/target pair present in
the corpus; missing, duplicate, unknown, and mismatched pairs show the generic
page without reflecting input.

The generic H1 remains. Valid pairs add “Your selected path: {fromRole} →
{toRole}” and “This path is shown for context. Your score uses the same five
questions for everyone and does not assess fit for a specific role.”
Context stays outside the questionnaire and never changes answers or scoring.
Retake removes only the result token, retaining context consistently.
Direct visits, score-only sharing, result decoding, and OG metadata remain unchanged.

## Corpus count

Freshly fetched main `603306f303ab431fba56e78236074a0ff9c53dfd` contains
**43 entries / 43 unique slugs**, counted from the entry-level slug fields.
This correction does not change the corpus. The previous 46-pivot claim is
not supported by the dataset.

## Corpus expansion (shipped together)

Added 14 new high-intent pivot slugs to `src/content/pivots.ts` (real
search-demand role transitions), each with the full page payload (TL;DR,
body blocks, transferable skills, timeline, FAQ) so they render with identical
GEO structure and the new on-ramp:

real-estate-agent-to-data-analyst · chef-to-operations-manager ·
flight-attendant-to-customer-success-manager · paralegal-to-legal-operations-manager ·
pharmacy-technician-to-clinical-data-analyst · teacher-to-instructional-designer ·
recruiter-to-people-operations-manager · military-veteran-to-project-manager ·
truck-driver-to-logistics-coordinator · barista-to-sales-development-representative ·
librarian-to-ux-researcher · accountant-to-financial-systems-analyst ·
social-media-manager-to-product-marketing-manager · event-planner-to-program-manager

## Verification contract

Focused tests cover canonical pairs, invalid/missing/duplicate/mismatched
parameters, result-token compatibility, and retake context retention.
Rendered review must cover teacher-to-product-manager and
accountant-to-data-analyst click-throughs at 1440×900 and 390×844,
direct/shared/invalid-result paths, completion, retake, focus and overflow.
Screenshots and a rendered UX verdict remain pending until attached to AIC-1283.
The scoring model, share codec, funnel and GEO structure are unchanged. The shared
article CTA copy is corrected to describe general readiness rather than role-fit
analysis or a weekly plan.
