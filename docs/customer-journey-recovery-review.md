# Customer journey recovery review

Recovered the unpublished customer-journey changes onto main at 399e82c. The original dirty checkout was preserved. Blog content, translations and pricing cadence changes were excluded: #284 is merged and #285–#287 remain draft, with #287 based on #286.

## Behavior

- Checkout retries reuse a Stripe idempotency key and preserve paid status/report linkage. A failed order write does not expose a payable URL.
- Team bypass requires a verified account with the matching configured email. Existing one-time, monthly, annual, lifetime and discount definitions remain supported.
- Signed webhooks and return verification share payment persistence, including asynchronous success and completed zero-total purchases. Failed persistence returns a retryable error.
- Guest purchases receive a signed HttpOnly browser capability. Verified account ownership can recover access; a matching email cannot override an explicitly linked owner.
- Paid report creation claims one report per order, rejects concurrent generation, retries stale empty claims, and completes the response only after a durable save. Partial streams and failed saves remain retryable without another payment.
- Checkout return preserves the uploaded profile or links directly to an existing saved report. Authentication retains a safe return path; sign-out clears purchase access.
- Dashboard and PDF access require purchase/account ownership. The existing public shared-report view remains available; this change is not a claim that every report-related endpoint is private.
- Journey events use pseudonymous identities and sanitized properties. Client attempts/returns are distinct from server checkout/payment events; analytics consumers should review the event-name changes.

## Verification in this checkout

- `npm test`: 24 files, **320 tests passed**. Includes checkout, webhook retries, paid-report persistence, interrupted streams, stale-worker protection, auth redirects/sign-out, and cross-account recovery denial with mocked services.
- `npx tsc --noEmit --incremental false`: passed.
- ESLint on all changed/new TypeScript files: passed; subsequently added paid-report tests also passed lint.
- `git diff --check`: passed.
- Playwright synthetic browser suite: **3 passed (10.0s)** after updating the historical test selector to the comparison drawer copy shipped in #284. Covers free result → pricing → checkout return with profile preservation, verification-outage retry, and default-English canonicalization. The test now waits for the visible drawer link and allows cold-page hydration before the first assertion.
- Earlier validation attempts hit `ENOSPC` during dependency installation and browser startup. A later run had sufficient disk space and completed all three browser tests. Validation reused the existing customer-journey checkout's dependencies. Only this task's failed install/cache/build artifacts were removed.
- Production build and real Stripe/Supabase/AI integration have not passed in this session. No production data, configuration, deployment or migrations were changed.

## Paperclip handoff

The configured local instance is company `7ba66a56-acae-4559-adbb-e9d2a9c417fd` on `http://127.0.0.1:3100`. Health, issue and agent API requests all failed to connect, including outside the shell sandbox. No agent messages were delivered and no settings or task records were changed.

The latest available backup is dated October 25. It lists CTO-owned AIC-1339, “QA synthetic isolation and authorized-save regression,” as blocked, and CMO-owned AIC-691, “Recover plan-abandoners with a checkout-recovery email,” as in review. These are historical records, not verified current ownership/status. Reconcile this draft with the CTO's QA task when Paperclip is available; preserve the existing email recovery work.

## Before marking ready

1. Preserve the passing synthetic browser suite when reconciling this patch with other drafts. Existing Base UI button and smooth-scroll development warnings remain outside this recovery change.
2. Build against the locked dependencies and run isolated Stripe test-mode + Supabase + model integration QA: payment/webhook replay, interrupted generation, save failure/retry, saved-report recovery, and cross-account denial.
3. Verify existing production schema matches the checked-in orders/reports migrations and inspect ownership/sharing expectations. The in-memory tests do not model Postgres constraints, RLS, or provider transport.
4. Reconcile current Paperclip tasks and analytics event consumers before merge.
