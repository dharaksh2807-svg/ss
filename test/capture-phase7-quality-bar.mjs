/**
 * Phase 7: Character, Locomotion & Camera Quality Bar Screenshot Evidence Capture
 * Run: node test/capture-phase7-quality-bar.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/phase7');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const errors = [];

async function makePage(browser, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return page;
}

async function shot(page, name) {
  await page.waitForTimeout(600);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ Saved: ${name}.png`);
}

(async () => {
  console.log('📸 Starting Phase 7 Quality Bar Evidence Capture...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Lobby — Hero Jax Presentation
    console.log('\n[1] Desktop Lobby — Hero Jax Presentation');
    {
      const page = await makePage(browser, DESKTOP);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await shot(page, 'phase7_01_desktop_lobby_jax');
      await page.close();
    }

    // 2. Mobile Portrait Lobby — Safe Area & Framing
    console.log('\n[2] Mobile Portrait Lobby — Safe Area & Framing');
    {
      const page = await makePage(browser, MOBILE);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await shot(page, 'phase7_02_mobile_lobby_framing');
      await page.close();
    }

    // 3. Desktop Gameplay — Classic Rear Chase Camera
    console.log('\n[3] Desktop Gameplay — Classic Rear Chase Camera');
    {
      const page = await makePage(browser, DESKTOP);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      // Start run
      await page.keyboard.press('Space');
      await page.waitForTimeout(1800);
      await shot(page, 'phase7_03_desktop_classic_gameplay');
      await page.close();
    }

    // 4. Character Focus Camera — 3/4 Side Profile & Stride
    console.log('\n[4] Character Focus Camera — 3/4 Hero Profile');
    {
      const page = await makePage(browser, DESKTOP);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        localStorage.setItem('metro_camera_mode', 'CHARACTER_FOCUS');
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.keyboard.press('Space');
      await page.waitForTimeout(2000);
      await shot(page, 'phase7_04_character_focus_gameplay');
      await page.close();
    }

    // 5. Mobile Portrait Gameplay — 3-Lane Centered Visibility
    console.log('\n[5] Mobile Portrait Gameplay — 3-Lane Centered Visibility');
    {
      const page = await makePage(browser, MOBILE);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        localStorage.setItem('metro_camera_mode', 'CLASSIC');
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.keyboard.press('Space');
      await page.waitForTimeout(2000);
      await shot(page, 'phase7_05_mobile_portrait_gameplay');
      await page.close();
    }

    // 6. Character Showroom / Roster Selection
    console.log('\n[6] Character Showroom / Roster Selection');
    {
      const page = await makePage(browser, DESKTOP);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      // Try opening character selector if button exists
      const charBtn = await page.$('#btn-characters, [data-action="characters"], #character-select-btn');
      if (charBtn) {
        await charBtn.click();
        await page.waitForTimeout(500);
        await shot(page, 'phase7_06_character_showroom');
      } else {
        console.log('  ℹ Character button not found by selector; skipping showroom modal capture');
      }
      await page.close();
    }

    console.log('\n🎉 Phase 7 Screenshot Capture Completed Successfully!');
  } catch (err) {
    console.error('❌ Capture error:', err);
  } finally {
    await browser.close();
  }
})();

