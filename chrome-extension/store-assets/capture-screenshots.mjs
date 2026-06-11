import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mockupDir = join(__dirname, 'screenshot-mockups');

const files = readdirSync(mockupDir)
  .filter(f => f.endsWith('.html'))
  .sort();

const browser = await chromium.launch({ headless: true });

for (const file of files) {
  const name = file.replace('.html', '.png');
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`file://${join(mockupDir, file)}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(__dirname, name) });
  await page.close();
  console.log(`Captured: ${name}`);
}

await browser.close();
console.log('\nAll screenshots captured.');
