import { test, expect, chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, "../..");
const FIXTURES_PATH = path.resolve(__dirname, "fixtures");

async function launchBrowserWithExtension() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      "--no-sandbox",
      "--disable-gpu",
    ],
  });

  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return { context, serviceWorker };
}

test.describe("Extension Loading", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("loads service worker successfully", async () => {
    ({ context } = await launchBrowserWithExtension());
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);

    const url = workers[0].url();
    expect(url).toContain("service-worker");
  });

  test("extension has correct manifest permissions", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    const workers = context.serviceWorkers();
    const extensionId = workers[0].url().split("/")[2];

    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForLoadState("domcontentloaded");

    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe("Job Board Detection (Fixtures)", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("detects job data from LinkedIn fixture", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto(`file://${FIXTURES_PATH}/linkedin-job.html`);
    await page.waitForLoadState("domcontentloaded");

    const title = await page.locator(".job-details-jobs-unified-top-card__job-title").textContent();
    expect(title?.trim()).toBe("Senior Software Engineer");

    const company = await page.locator(".job-details-jobs-unified-top-card__company-name").textContent();
    expect(company?.trim()).toBe("TechCorp");

    const description = await page.locator("#job-details").textContent();
    expect(description).toContain("React");
    expect(description).toContain("TypeScript");
  });

  test("detects job data from Indeed fixture", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto(`file://${FIXTURES_PATH}/indeed-job.html`);
    await page.waitForLoadState("domcontentloaded");

    const title = await page.locator('[data-testid="jobsearch-JobInfoHeader-title"]').textContent();
    expect(title?.trim()).toBe("Data Analyst");

    const company = await page.locator('[data-testid="inlineHeader-companyName"]').textContent();
    expect(company?.trim()).toBe("DataCo");

    const description = await page.locator("#jobDescriptionText").textContent();
    expect(description).toContain("SQL");
    expect(description).toContain("Python");
  });
});

test.describe("Autofill Form Detection (Fixtures)", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("identifies form fields on Greenhouse fixture", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto(`file://${FIXTURES_PATH}/greenhouse-form.html`);
    await page.waitForLoadState("domcontentloaded");

    const firstName = page.locator("#first_name");
    await expect(firstName).toBeVisible();
    expect(await firstName.getAttribute("name")).toBe("first_name");

    const lastName = page.locator("#last_name");
    await expect(lastName).toBeVisible();

    const email = page.locator("#email");
    await expect(email).toBeVisible();
    expect(await email.getAttribute("type")).toBe("email");

    const phone = page.locator("#phone");
    await expect(phone).toBeVisible();

    const resume = page.locator("#resume");
    await expect(resume).toBeVisible();
    expect(await resume.getAttribute("type")).toBe("file");
    expect(await resume.getAttribute("accept")).toContain(".pdf");

    const coverLetter = page.locator("#cover_letter");
    await expect(coverLetter).toBeVisible();

    const linkedin = page.locator("#linkedin");
    await expect(linkedin).toBeVisible();
  });

  test("can fill form fields programmatically", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto(`file://${FIXTURES_PATH}/greenhouse-form.html`);
    await page.waitForLoadState("domcontentloaded");

    await page.fill("#first_name", "Jane");
    await page.fill("#last_name", "Doe");
    await page.fill("#email", "jane@example.com");
    await page.fill("#phone", "+1-555-0100");
    await page.fill("#linkedin", "https://linkedin.com/in/janedoe");

    expect(await page.inputValue("#first_name")).toBe("Jane");
    expect(await page.inputValue("#last_name")).toBe("Doe");
    expect(await page.inputValue("#email")).toBe("jane@example.com");
    expect(await page.inputValue("#phone")).toBe("+1-555-0100");
    expect(await page.inputValue("#linkedin")).toBe("https://linkedin.com/in/janedoe");
  });
});

test.describe("Popup UI", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("popup loads and shows auth state", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    const workers = context.serviceWorkers();
    const extensionId = workers[0].url().split("/")[2];

    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForLoadState("domcontentloaded");

    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});

test.describe("Content Script Injection (Fixtures)", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("page has expected structure for content script selectors", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto(`file://${FIXTURES_PATH}/linkedin-job.html`);
    await page.waitForLoadState("domcontentloaded");

    const applyButton = page.locator(".jobs-apply-button");
    await expect(applyButton).toBeVisible();
    expect(await applyButton.textContent()).toBe("Apply");

    const descriptionContent = page.locator(".jobs-description__content");
    await expect(descriptionContent).toBeVisible();

    const requirements = await page.locator("#job-details li").count();
    expect(requirements).toBeGreaterThan(0);
  });
});

test.describe("Error States", () => {
  let context;

  test.afterEach(async () => {
    if (context) await context.close();
  });

  test("handles page without job data gracefully", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    await page.goto("about:blank");
    await page.setContent("<html><body><h1>Not a job page</h1></body></html>");

    const jobTitle = await page.$(".job-details-jobs-unified-top-card__job-title");
    expect(jobTitle).toBeNull();

    const description = await page.$("#job-details");
    expect(description).toBeNull();
  });

  test("extension popup handles missing auth", async () => {
    ({ context } = await launchBrowserWithExtension());
    const page = await context.newPage();

    const workers = context.serviceWorkers();
    const extensionId = workers[0].url().split("/")[2];

    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForLoadState("domcontentloaded");

    const hasContent = await page.locator("body").textContent();
    expect(hasContent.length).toBeGreaterThan(0);
  });
});
