# Blog destination and promise audit

Base: `399e82c01ef1e73fc772a483356e645ce80f680c`. Source audit; no production conversion claim.

## Verified contracts

- `/assessment`: existing values/energy assessment; redirects visitors without `intake_profile` to `/onboarding`. Its application behavior and intentional onboarding links were not changed.
- `/quiz`: four public questions. `scoreRoles` uses interests plus an experience-band nudge, not current-role skills. Copy now describes a role exploration suggestion, never a skills audit, qualification decision, hiring prediction, or personalized roadmap.
- `/readiness`: five self-report questions, public readiness score; not role matching or a skills test.
- `/free`: job-posting skills checker. Keep links whose promise is checking a posting.
- `/free?mode=upload`: resume file upload; not pasted LinkedIn data or an employer ATS simulation.

## Per-article decisions

All occurrences were reviewed with nearby paragraphs. The public invitations below did not describe a continuation of the values assessment. Seven sampled articles are handled separately by the reader-journey pass.

| Article slug | Corrected destination | Occurrences reviewed |
| --- | --- | --- |
| `ai-career-tools-vs-career-coach-2026` | `/quiz` | 1 |
| `ai-engineer-vs-ml-engineer-vs-data-scientist-2026` | `/quiz` | 1 |
| `ai-job-titles-explained-career-changers-2026` | `/quiz` | 1 |
| `can-chatgpt-help-you-switch-to-ai-career-2026` | `/quiz` | 1 |
| `can-you-get-an-ai-job-with-no-experience-2026` | `/quiz` | 1 |
| `do-you-need-to-code-to-get-an-ai-job-2026` | `/quiz` | 1 |
| `entry-level-ai-jobs-for-career-changers-2026` | `/quiz` | 1 |
| `how-to-break-into-ai-product-management-2026` | `/quiz` | 1 |
| `how-to-break-into-ai-when-agents-do-entry-level-work-2026` | `/quiz` | 1 |
| `how-to-build-ai-portfolio-no-experience-2026` | `/readiness` | 1 |
| `how-to-explain-career-gap-when-pivoting-into-ai-2026` | `/quiz` | 1 |
| `how-to-find-remote-ai-jobs-career-changer-2026` | `/quiz` | 1 |
| `how-to-get-a-job-at-an-ai-startup-non-technical-2026` | `/quiz` | 1 |
| `how-to-get-an-ai-job-over-40-career-changer-2026` | `/quiz` | 1 |
| `how-to-get-internal-transfer-into-ai-role-2026` | `/quiz` | 1 |
| `how-to-learn-ai-skills-for-free-2026` | `/quiz` | 1 |
| `how-to-leverage-domain-expertise-for-ai-job-2026` | `/quiz` | 1 |
| `how-to-negotiate-first-ai-job-offer-career-changer-2026` | `/quiz` | 1 |
| `how-to-network-into-ai-jobs-without-tech-background-2026` | `/free?mode=upload` | 1 |
| `how-to-network-into-ai-roles-2026` | `/quiz` | 1 |
| `how-to-pass-an-ai-conducted-interview-2026` | `/quiz` | 1 |
| `how-to-pivot-from-consulting-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-customer-service-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-customer-success-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-data-analyst-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-engineering-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-finance-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-healthcare-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-hr-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-insurance-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-journalism-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-law-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-legal-to-ai-2026` | `/free?mode=upload` | 1 |
| `how-to-pivot-from-manufacturing-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-marketing-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-military-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-nonprofit-to-ai-2026` | `/quiz` | 2 |
| `how-to-pivot-from-operations-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-project-management-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-real-estate-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-recruiting-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-sales-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-software-engineering-to-ai-pm-2026` | `/quiz` | 1 |
| `how-to-pivot-from-supply-chain-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-from-ux-design-to-ai-2026` | `/quiz` | 1 |
| `how-to-pivot-into-ai-after-a-layoff-2026` | `/quiz` | 1 |
| `how-to-pivot-into-ai-governance-career-2026` | `/quiz` | 1 |
| `how-to-read-ai-job-description-2026` | `/free` | 1 |
| `how-to-talk-about-non-technical-background-ai-interview-2026` | `/quiz` | 1 |
| `how-to-transition-into-ai-without-quitting-your-job-2026` | `/quiz` | 1 |
| `how-to-use-ai-tools-to-accelerate-career-pivot-2026` | `/quiz` | 1 |
| `is-an-ai-bootcamp-worth-it-2026` | `/quiz` | 1 |
| `is-prompt-engineering-a-real-career-2026` | `/quiz` | 1 |
| `should-you-get-an-ai-certification-2026` | `/quiz` | 1 |
| `what-ai-skills-should-you-learn-first-2026` | `/quiz` | 2 |
| `what-does-an-ai-enablement-manager-do-2026` | `/quiz` | 1 |
| `what-does-an-ai-product-manager-do-2026` | `/quiz` | 1 |
| `what-hiring-managers-look-for-in-ai-candidates-2026` | `/quiz` | 1 |
| `what-salary-can-you-expect-first-ai-role-2026` | `/quiz` | 1 |
| `what-to-do-when-your-company-is-replacing-your-job-with-ai-2026` | `/quiz` | 1 |
| `which-ai-roles-are-hiring-most-in-2026` | `/quiz` | 1 |

## Copy integrity

Rewrote the associated promises and adjacent paragraphs that asserted exact skill gaps, eligibility, current hiring matches, timelines, ATS results, or a free full roadmap. Removed the duplicate nonprofit invitation. Preserved existing source/external links and role-guide links. The tools comparison now links current one-time offers instead of the obsolete $49/month founding offer and waitlist; checkout and pricing configuration are untouched. Source corroboration: `src/lib/stripe.ts` report amount 1900 with payment mode; pricing page displays one-time report and lifetime offers.

## Limits

This is a bounded review of links to `/assessment` and their associated promises, plus the requested stale own-product pricing copy. It does not validate all labor-market claims, competitor prices, article factual claims, or older non-assessment product claims. These need a separate sourced editorial review. No conversion lift can be inferred from source changes. Production measurements and browser validation are reported in the overall five-pass record.
