import { chromium, expect } from '@playwright/test';
const base = process.env.BLOG_TEST_URL || 'http://127.0.0.1:3017';
const browser = await chromium.launch({headless:true});
const layoutOnly = process.env.BLOG_LAYOUT_ONLY === '1';
const context = await browser.newContext({javaScriptEnabled:!layoutOnly});
const page = await context.newPage();
const slugs = [
 'how-to-pivot-into-ai-without-starting-over-2026',
 'how-to-pivot-into-ai-when-your-job-is-being-automated-2026',
 'how-to-pivot-from-engineering-to-ai-2026',
 'ai-job-titles-explained-career-changers-2026',
 'what-does-an-ai-enablement-manager-do-2026',
];
const results=[];
try {
 for(const width of [320,375,390,1280]) {
  await page.setViewportSize({width,height:900});
  for(const slug of slugs) {
   const response=await page.goto(`${base}/de/blog/${slug}`,{waitUntil:'networkidle',timeout:120000});
   expect(response.status()).toBe(200);
   await expect(page.locator('h1')).toHaveCount(1);
   const early=page.locator('aside[aria-labelledby="next-step-after_takeaways"]');
   const end=page.locator('aside[aria-labelledby="next-step-article_end"]');
   await expect(early).toHaveCount(1); await expect(end).toHaveCount(1);
   const link=early.locator('a');
   expect(await link.getAttribute('href')).toMatch(/^\/de\/(quiz|readiness|free)/);
   expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
   results.push({width,slug,status:'passed'});
   if(width===320 && slug===slugs[0]) await page.screenshot({path:'/tmp/blog-pinned-320.png',fullPage:false});
  }
 }
 if(layoutOnly) { console.log(JSON.stringify({results,scope:'Server-rendered layout only; JavaScript disabled. No hydrated flow validation.'},null,2)); } else {
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}/de/blog/${slugs[0]}`,{waitUntil:'networkidle'});
 const upload=page.locator('aside[aria-labelledby="next-step-after_takeaways"] a');
 await upload.focus(); await expect(upload).toBeFocused(); await page.keyboard.press('Enter');
 await page.waitForURL('**/de/free?mode=upload');
 await expect(page.locator('input[type="file"]')).toBeAttached();
 await expect(page.getByRole('button',{name:'Remove quiz suggestion'})).toHaveCount(0);
 await page.goBack(); await expect(page).toHaveURL(new RegExp(`/de/blog/${slugs[0]}`));
 await page.goto(`${base}/quiz`,{waitUntil:'networkidle'});
 await page.locator('select').selectOption('Design');
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 await page.getByRole('button',{name:'3–5 years',exact:true}).click();
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 await page.getByRole('button',{name:'Design & UX'}).click();
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 await page.getByRole('button',{name:'Just exploring',exact:true}).click();
 await page.getByRole('button',{name:'See my match'}).click();
 await expect(page.locator('h1')).toHaveText('AI UX Designer');
 await page.getByRole('link',{name:/Upload a resume/}).click();
 await page.waitForURL('**/free?mode=upload&source=career_quiz');
 await expect(page.getByRole('button',{name:'Remove quiz suggestion'})).toBeVisible();
 await page.getByRole('button',{name:'Remove quiz suggestion'}).click();
 await expect(page.getByRole('button',{name:'Remove quiz suggestion'})).toHaveCount(0);
 await page.goto(`${base}/free?mode=upload`);
 await expect(page.getByRole('button',{name:'Remove quiz suggestion'})).toHaveCount(0);
 await page.screenshot({path:'/tmp/blog-upload-mobile.png',fullPage:true});
 console.log(JSON.stringify({results,journey:'keyboard upload, Back, real quiz result, one-shot/removable context passed'},null,2));
}
} catch(error) { console.error('URL',page.url()); console.error((await page.locator('body').innerText()).slice(0,3500)); await page.screenshot({path:'/tmp/blog-failure.png',fullPage:true}); throw error; } finally { await browser.close(); }
