import { test, expect } from '@playwright/test';
const profile = { email: 'fixture@example.test', skills: ['Analysis'], transferableSkills: ['Communication'], experience: [], education: [], certifications: [], interests: [] };
const snapshot = { profileSummary: 'Synthetic fixture', estimatedSalaryUplift: 10, paths: [{ targetRole: 'Product Manager', targetIndustry: 'Software', matchScore: 70, rationale: 'Fixture only', topSkillGaps: [{ skill: 'SQL', priority: 'high', transferabilityScore: 40 }] }], topTransferableStrengths: [{ skill: 'Communication', confidence: 70, aiBoostExplanation: 'Fixture only' }] };
test.beforeEach(async ({ page }) => {
  // No outbound provider, analytics, payment, or model requests in this test.
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname === 'localhost') return route.continue();
    return route.abort();
  });
  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 0, count: 0, reports: [] }) }));
});
test('free result → one-time offer → checkout return preserves the uploaded profile', async ({ page }) => {
  await page.addInitScript(({ profile, snapshot }) => {
    sessionStorage.setItem('free_profile', JSON.stringify(profile));
    sessionStorage.setItem('free_snapshot', JSON.stringify(snapshot));
  }, { profile, snapshot });
  await page.goto('/free-results');
  await expect(page.getByText('Product Manager', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  // Follow the comparison copy shipped in #284 and wait for the drawer.
  await page.getByRole('button', { name: 'Compare Full Report — $19', exact: true }).first().click();
  const offerLink = page.getByRole('link', { name: 'Continue to $19 Report', exact: true });
  await expect(offerLink).toBeVisible();
  await offerLink.click();
  await expect(page).toHaveURL(/pricing/);
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Get My Report — $19', exact: true }) });
  await expect(form).toBeVisible();
  let checkoutBody: Record<string, unknown> | undefined;
  await page.route('**/api/checkout', async route => {
    checkoutBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'http://localhost:3218/checkout/success?session_id=cs_browser_fixture' }) });
  });
  await page.route('**/api/checkout/verify?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ paid: true, email: 'buyer@example.test', reportId: null }) }));
  await form.getByRole('textbox', { name: '' }).first().fill('buyer@example.test');
  await form.getByRole('button', { name: 'Get My Report — $19', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Payment Confirmed!' })).toBeVisible();
  expect(checkoutBody?.plan).toBe('report');
  expect(checkoutBody?.checkoutAttemptId).toMatch(/^[a-f0-9-]{36}$/i);
  await expect(page.getByRole('link', { name: /Build My Roadmap/ })).toHaveAttribute('href', '/onboarding/profile?generate=1');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('intake_profile')!).email)).toBe('buyer@example.test');
});
test('verification outage offers retry rather than another payment', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/checkout/verify?*', route => {
    attempts++;
    return route.fulfill({ status: attempts === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(attempts === 1 ? { error: 'Retry without paying again.' } : { paid: true, email: 'buyer@example.test', reportId: 'report_fixture' }) });
  });
  await page.goto('/checkout/success?session_id=cs_browser_fixture');
  await expect(page.getByRole('button', { name: 'Retry verification' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry verification' }).click();
  await expect(page.getByRole('link', { name: /Build My Roadmap/ })).toHaveAttribute('href', '/report/report_fixture');
});
test('default English rewrites internally and explicit English canonicalizes once', async ({ page }) => {
  const response = await page.goto('/free-results');
  expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const canonical = await page.goto('/en/pricing?utm_source=regression');
  expect(canonical?.status()).toBe(200);
  await expect(page).toHaveURL('/pricing?utm_source=regression');
  expect(canonical?.request().redirectedFrom()).not.toBeNull();
  expect(canonical?.request().redirectedFrom()?.redirectedFrom()).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
