# Beta Testing AICareerPivot (full product, free) — AIC-49

This is the how-to for you and friends to test the **complete paid product** end-to-end
without paying, and where to send feedback.

Live app: **https://ai-career-pivot.vercel.app**

---

## 1. Get full access for free (the "bypass" path)

The paid features (full multi-timeline roadmap, resume tailor, salary coach, mock
interviews, etc.) are unlocked by an *entitlement* that is normally granted after Stripe
checkout. For beta testers there is a built-in **payment-bypass** so you never get charged.

**How it works (code):** `src/app/api/checkout/route.ts` → `isBypassEmail()` in
`src/lib/stripe.ts`. Any email listed in the `BYPASS_PAYMENT_EMAILS` env var, when it goes
through checkout, is recorded as a `$0` **paid** order (`discount_code: TEAM_BYPASS`) and
immediately redirected to `/checkout/success` with full entitlement — no card, no charge.

### One-time setup (board / ops — ~2 min)
1. In **Vercel → Project → Settings → Environment Variables (Production)**, set:
   ```
   BYPASS_PAYMENT_EMAILS = palak.piu@gmail.com, friend1@example.com, friend2@example.com
   ```
   (comma-separated; add every tester's email here).
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is also set in Production (the bypass writes the
   $0 order via the service-role client; without it checkout returns a 500).
3. **Redeploy** production (env changes only take effect on a new deployment).

> CTO can set this for you if you share the tester email list and grant Vercel access —
> otherwise the three steps above are all it takes.

### Tester flow (each person)
1. Go to https://ai-career-pivot.vercel.app and take the **assessment** / start a pivot.
2. When you reach **checkout / pricing**, enter the **exact email** that was added to the
   bypass list.
3. You'll land on the success page with **full access unlocked** — $0, no card needed.
4. Use the product normally from there.

---

## 2. Alternative: real Stripe checkout with a 100%-off code

If you'd rather exercise the *real* Stripe flow (recommended for at least one tester, to
validate the paying path), create a **100%-off promotion code** in the Stripe Dashboard and
enter it as the discount code at checkout. The route already applies active promotion codes
(`stripe.promotionCodes.list` → `sessionParams.discounts`). This still records a real order
row but at $0.

> Do **not** use Stripe *test* card `4242…` on production — prod uses live keys, so a test
> card will be declined. Use the bypass list (option 1) or a 100%-off promo code instead.

---

## 3. What to test (suggested walkthrough)

Hit each of the core surfaces and note anything confusing, broken, or slow:

| Area | What to try |
|---|---|
| **Assessment → Plan** | Complete the intake; confirm an AI pivot plan/report generates. |
| **Interactive roadmap** | Free tier shows 2 milestones; after unlock, all phases/milestones + check-off progress. |
| **Resume tailor + ATS** | Upload a resume, paste a JD (or pick one from the job tracker), check the live ATS match % and missing-keyword list. |
| **Salary negotiation coach** | Open the Salary tab; try the market-data view, role-play chat, counter-offer generator. |
| **Mock interviews** | Run a voice mock interview (browser mic permission); confirm speech in/out works. |
| **Job tracker** | Add jobs, move them across stages, set priority/deadline. |
| **Cover letters** | Generate a cover letter for a tracked job. |
| **Localization** | Switch locale (e.g. `/es`, `/fr`) and confirm content + number/currency formatting look right. |
| **Checkout success** | Confirm the success page + "what you unlocked" reinforcement renders. |

Edge cases worth poking: reload mid-flow, mobile viewport, a resume with an odd file type,
an empty/garbage JD, switching locale mid-session.

---

## 4. How to send feedback

Pick whichever is easiest — all are fine:
- **Fastest:** reply on AIC-49 with a bulleted list (one line per issue: page + what
  happened + what you expected).
- Screenshots welcome — drag them into the issue comment.
- For a clear bug, include the URL and the steps to reproduce; CTO will file a child issue
  and fix it.

Template:
```
- [page/flow] — [what happened] — [what I expected] — [severity: blocker/annoying/nit]
```

---

## Notes / limitations
- Bypass and real-checkout both require `SUPABASE_SERVICE_ROLE_KEY` in prod (already needed
  for normal paid checkout).
- The bypass grants the same entitlement a real purchase does, so testers see the true
  post-purchase experience — not a mock.
- Remove tester emails from `BYPASS_PAYMENT_EMAILS` after the beta if you want to close the
  free door.
