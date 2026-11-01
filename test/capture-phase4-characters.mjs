/**
 * Phase 4 character & locomotion screenshot capture.
 * Run: node test/capture-phase4-characters.mjs
 * Requires dev server on http://localhost:3000
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/phase4');
const BASE_URL = 'http://localhost:3000';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };

const errors = [];

async function makePage(browser, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return page;
}

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(500);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Desktop lobby — default character ──────────────────────────────────
  console.log('\n[1] Desktop lobby — default character');
  {
    const page = await makePage(browser, DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await shot(page, 'phase4_desktop_lobby_character', DESKTOP);
    await page.close();
  }

  // ── 2. Mobile lobby ────────────────────────────────────────────────────────
  console.log('\n[2] Mobile lobby');
  {
    const page = await makePage(browser, MOBILE);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await shot(page, 'phase4_mobile_lobby_character', MOBILE);
    await page.close();
  }

  // ── 3. Gameplay running state (desktop) ────────────────────────────────────
  console.log('\n[3] Gameplay running — desktop');
  {
    const page = await makePage(browser, DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const playBtn = page.locator('#start-play-btn, .arcade-play-btn').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(2500); // let run cycle play
    }
    await shot(page, 'phase4_desktop_running', DESKTOP);

    // ── 4. Jump state ──────────────────────────────────────────────────────
    console.log('\n[4] Jump — desktop');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await shot(page, 'phase4_desktop_jump', DESKTOP);

    // ── 5. Slide state ─────────────────────────────────────────────────────
    console.log('\n[5] Slide — desktop');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await shot(page, 'phase4_desktop_slide', DESKTOP);

    await page.close();
  }

  // ── 6. Gameplay running — mobile ───────────────────────────────────────────
  console.log('\n[6] Gameplay running — mobile');
  {
    const page = await makePage(browser, MOBILE);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const playBtn = page.locator('#start-play-btn, .arcade-play-btn').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(2200);
    }
    await shot(page, 'phase4_mobile_running', MOBILE);
    await page.close();
  }

  await browser.close();

  console.log('\n─────────────────────────────────────────');
  if (errors.length === 0) {
    console.log('Console errors: NONE');
  } else {
    console.log(`Console errors (${errors.length}):`);
    errors.forEach(e => console.log('  ✗', e));
  }
  console.log('Phase 4 screenshots complete →', OUT_DIR);
  process.exit(errors.length > 0 ? 1 : 0);
})();

