/**
 * Phase 3 HUD & Modal screenshot capture script.
 * Run: node test/capture-phase3-hud.mjs
 * Requires dev server on http://localhost:3000
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/phase3');
const BASE_URL = 'http://localhost:3000';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };

async function capture(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(600);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
  return file;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  async function makePage(viewport) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    return page;
  }

  // ── 1. Desktop lobby ──────────────────────────────────────────────────────
  console.log('\n[1] Desktop lobby 1440×900');
  {
    const page = await makePage(DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await capture(page, 'phase3_desktop_lobby_1440x900', DESKTOP);
    await page.close();
  }

  // ── 2. Mobile lobby ───────────────────────────────────────────────────────
  console.log('\n[2] Mobile lobby 390×844');
  {
    const page = await makePage(MOBILE);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await capture(page, 'phase3_mobile_lobby_390x844', MOBILE);
    await page.close();
  }

  // ── 3. Pause modal (desktop) ──────────────────────────────────────────────
  console.log('\n[3] Pause modal — desktop');
  {
    const page = await makePage(DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Start game
    const playBtn = page.locator('#start-play-btn, .arcade-play-btn').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(1200);
    }
    // Pause via keyboard Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await capture(page, 'phase3_desktop_pause_modal', DESKTOP);
    await page.close();
  }

  // ── 4. Game Over modal (desktop) ─────────────────────────────────────────
  console.log('\n[4] Game Over modal — desktop (force via JS)');
  {
    const page = await makePage(DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Force show game-over overlay directly
    await page.evaluate(() => {
      const el = document.getElementById('game-over-overlay');
      if (el) {
        el.style.display = 'flex';
        el.classList.add('visible');
      }
      // Populate score
      const scoreEl = document.getElementById('game-over-score-value');
      if (scoreEl) scoreEl.textContent = '42,750';
      const distEl = document.getElementById('game-over-distance-value');
      if (distEl) distEl.textContent = '1.24 km';
      const coinEl = document.getElementById('game-over-coins-value');
      if (coinEl) coinEl.textContent = '88';
    });
    await page.waitForTimeout(500);
    await capture(page, 'phase3_desktop_game_over', DESKTOP);
    await page.close();
  }

  // ── 5. Game Over modal (mobile) ───────────────────────────────────────────
  console.log('\n[5] Game Over modal — mobile 390×844');
  {
    const page = await makePage(MOBILE);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const el = document.getElementById('game-over-overlay');
      if (el) {
        el.style.display = 'flex';
        el.classList.add('visible');
      }
      const scoreEl = document.getElementById('game-over-score-value');
      if (scoreEl) scoreEl.textContent = '42,750';
    });
    await page.waitForTimeout(500);
    await capture(page, 'phase3_mobile_game_over', MOBILE);
    await page.close();
  }

  // ── 6. Revive modal (desktop) ────────────────────────────────────────────
  console.log('\n[6] Revive modal — desktop');
  {
    const page = await makePage(DESKTOP);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const el = document.getElementById('revive-overlay');
      if (el) {
        el.style.display = 'flex';
        el.classList.add('visible');
      }
    });
    await page.waitForTimeout(600);
    await capture(page, 'phase3_desktop_revive_modal', DESKTOP);
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
  console.log('Phase 3 screenshots complete →', OUT_DIR);
  process.exit(errors.length > 0 ? 1 : 0);
})();
