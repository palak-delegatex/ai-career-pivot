# Five-pass blog reader-journey review

Base: main `399e82c01ef1e73fc772a483356e645ce80f680c`, reverified through GitHub October23,2026. Isolated checkout; original web-vitals badge checkout untouched. No pricing configuration, entitlement, credential, permission, security or consent changes.

## 1. Evidence and reader intent

Parent analytics audit reported October23, rolling30days: production ai-career-pivot.com, Regular traffic, localized URLs included. 518 blog-landing sessions;7 continued to a non-blog page (1.35%),3 reached /free (0.58%),1 pricing,0 /pivot. All3 /free sessions recorded free_results_viewed; this tiny sample cannot establish lift. Rolling14days:230 landings,3 onward,1 free. Desktop369/4 onward; mobile147/3. Three tracked blog CTA clicks are not all clicks because raw MDX links were uninstrumented. Internal/test person exclusion changed no counts; zero pageviews had that marker. These are onward-navigation rates, not bounce rates. Exact query artifact was not supplied to this checkout.

Priority landing articles: German job-automated47, engineering41, enablement-manager28, job-titles27, each zero observed non-blog continuation. Add the pinned guide. Historical article_depth_reached stopped October13 while pageviews continued; current main has no emitter. Missing depth events do not prove absent reading.

Verified contracts: /quiz suggests a direction from interests and experience; /readiness reflects planning constraints/motivation/urgency; /free checks a posting; /free?mode=upload accepts a resume file. /assessment remains the intake-dependent values flow. See blog-assessment-link-audit.md and blog-content-review.md.

## 2. Contextual destinations and conversion flow

Corrected public article invitations AND associated promises, not a runtime blanket URL rewrite. Existing application assessment/onboarding behavior stays intact. Snapshot CTA opens upload mode; seven locale catalogs no longer promise LinkedIn input or a completion-time guarantee.

Explicit blog-next-steps.ts mapping selects five priority articles, offering one in-flow action after takeaways and the same action after the article. Legacy invitations removed in those posts. Enablement gets a source-consistent takeaway summary. No popup, sticky overlay, forced signup or urgency. All other articles retain editorial placement.

Quiz now describes its actual interest-based suggestion. Removed decorative locked score and free-full-roadmap promise. Optional resume analysis has explicit one-use context, visible and removable on upload. Retakes/unrelated uploads clear old context. No scoring-algorithm expansion.

## 3. Responsive UX, accessibility and content integrity

Cards have wrapping text, bounded width,44px minimum action height, visible focus, labelled aside/headings. New copy exists in all7 locales. Real next-intl component tests verify locale behavior. External URLs, fragments, protocol-relative links and explicit locale prefixes are preserved.

Independent review fixed surrounding false promises, misleading headings, FAQ/TLDR contradictions and obsolete subscription descriptions. Root separately reviewed original7 footer changes. Removed engineering duplicate body H1 and added regression coverage. All71 final changed MDX articles parsed/compiled. Checkout prices unchanged. Related-post reranking and duplicate body/template FAQs (including flagship/certification) are deferred editorial work.

## 4. Analytics correctness and regression tests

Raw MDX product links emit canonical cta_clicked with static link text, blog_slug, destination and blog_inline placement. Named CTA components remain separate, avoiding double emission. External/reading links do not count as product CTA clicks. Unprefixed internal links preserve active locale.

blog_cta_viewed means >=50% of the CTA link intersects viewport, once per article+placement+destination per mounted component. It is not dwell time, active-tab visibility or proof of attention. Missing IntersectionObserver means no impression. Existing SDK loading/consent controls capture. No blog form data added.

career_quiz_completed now counts a valid rendered result, not a submit attempt. Historical counts are not directly comparable; annotate rollout date. Pricing clicks no longer emit quiz-to-free. No field measurements of these changes and no conversion-lift claim.

## 5. Independent review and validation

Separate reviewers handled content and navigation. Navigation review caught impression suppression across reused article identities and fixed dedup keys. Locale component tests exercise real next-intl Links with framework navigation mocked; they are not browser E2E tests.

Passed: full Vitest18files/294tests; TypeScript tsc --noEmit --incremental false; focused ESLint; final71-article MDX compilation; git diff --check. After H1 change, affected16tests passed again. Initial tests caught missing takeaway metadata and test-module resolution; fixed and full suite rerun.

Repository lint fails18errors/40warnings, all error locations unchanged from base: free-results, pricing cadence, badges, documents, extension banner, FollowUpChat, market banner, networking CRM, ResumeTailorSheet, streak calendar, WeeklyCheckIn, extension/mobile hooks. This is not a clean repository lint result.

Build FAILED: existing next/font imports could not fetch Google Fonts (DNS ENOTFOUND fonts.googleapis.com). Later local server startup succeeded on loopback. Hydrated browser run FAILED: existing SiteNav throws because NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are absent. HTTP200 alone was insufficient; browser rendered an error screen. No credentials/configuration added. Server-rendered browser checks with JavaScript disabled PASSED all20 combinations (5 priority articles ×320/375/390/1280px): one H1, exactly2 contextual cards, German hrefs, >=44px action height, no horizontal document overflow. Mobile screenshot inspected. These are static layout checks, not hydrated E2E. Keyboard/Back/real quiz-to-upload browser flow remains unrun past the configuration failure; component coverage is separate. Browser script scripts/blog-journey.browser.mjs supports BLOG_TEST_URL and BLOG_LAYOUT_ONLY=1. An initial Next-button selector was corrected before reaching that step; no passing journey claim. No alternate execution environment or mock-font production configuration used.

Exact remote heads and CI reported with draft PRs. No merge or production deployment. Full browser acceptance remains outstanding before promoting drafts.

## Publication and CI checkpoint

Draft #286: editorial commit28b36c275ce971b2594d94d2fb1f9dcbe0c6daa8, base main. Draft #287: functional branch stacked on #286. Initial functional commit335bdc8e8978200c97486a1a5e236400c2ecc9c8. Remote heads confirmed via PR metadata. Vercel previews for these exact commits were QUEUED (not successful); GitHub Actions returned no runs. Updated documentation/browser-script commit receives its own exact-head check, reported in the task. No production deployment or merge.
