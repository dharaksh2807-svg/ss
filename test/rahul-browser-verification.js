import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runRahulBrowserVerification() {
  console.log('🚀 Launching Rahul Gandhi Playwright browser verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Reset localStorage to clean state
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Open Shop Modal & Verify Featured Banner
  console.log('1. Opening Shop Modal...');
  await page.click('#start-shop-btn');
  await page.waitForTimeout(600);

  const rahulBanner = await page.$('.rahul-featured-banner');
  console.log('Rahul Gandhi Featured Banner present:', !!rahulBanner);

  const shopFeaturedPath = path.join(ARTIFACT_DIR, 'shop_rahul_featured.png');
  await page.screenshot({ path: shopFeaturedPath });
  console.log('Saved screenshot:', shopFeaturedPath);

  // 2. Switch to Characters Tab in Shop
  console.log('2. Switching to Characters Tab in Shop...');
  await page.click('#shop-tabs .arcade-tab-btn[data-cat="CHARACTERS"]');
  await page.waitForTimeout(600);

  const shopCharsPath = path.join(ARTIFACT_DIR, 'shop_characters_tab.png');
  await page.screenshot({ path: shopCharsPath });
  console.log('Saved screenshot:', shopCharsPath);

  // 3. Click 3D Preview button for Rahul Gandhi
  console.log('3. Opening 3D Showroom for Rahul Gandhi...');
  await page.click('[data-view-char="char_rahul_gandhi"]');
  await page.waitForTimeout(1000);

  const showroomPath = path.join(ARTIFACT_DIR, 'showroom_rahul_3d.png');
  await page.screenshot({ path: showroomPath });
  console.log('Saved screenshot:', showroomPath);

  // 4. Click Equip Free Run in Showroom
  console.log('4. Equipping Rahul Gandhi for free trial run...');
  const res = await page.evaluate(() => {
    const btn = document.getElementById('char-action-btn');
    if (!btn) return { error: 'No btn' };
    const textBefore = btn.textContent?.trim();
    btn.click();
    const textAfter = btn.textContent?.trim();
    const raw = localStorage.getItem('metro_progression_v1');
    return {
      textBefore,
      textAfter,
      state: raw ? JSON.parse(raw) : null
    };
  });
  console.log('Showroom Action Result:', res);
  await page.waitForTimeout(500);

  // 5. Start Game Run with Rahul Gandhi
  console.log('5. Starting game run with Rahul Gandhi...');
  await page.evaluate(() => {
    window.__METRO_GAME__.startRun();
  });
  await page.waitForTimeout(1200);

  // Jump and slide
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(1500);

  const gameplayPath = path.join(ARTIFACT_DIR, 'gameplay_rahul_run.png');
  await page.screenshot({ path: gameplayPath });
  console.log('Saved screenshot:', gameplayPath);

  // 6. Verify Trial Decrement after starting run
  const trialsRemaining = await page.evaluate(() => {
    const raw = localStorage.getItem('metro_progression_v1');
    if (!raw) return null;
    return JSON.parse(raw).rahulTrialsRemaining;
  });
  console.log('Rahul Gandhi trials remaining after run start:', trialsRemaining);

  await browser.close();
  console.log('✅ Browser verification completed successfully!');
}

runRahulBrowserVerification().catch((err) => {
  console.error('Browser verification error:', err);
  process.exit(1);
});
