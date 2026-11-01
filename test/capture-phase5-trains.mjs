/**
 * Phase 5 — Train & Obstacle Visual Capture
 * Captures representative states showing train materials, ramp readability,
 * rooftop traversal, AC/vent obstacles, and ground obstacle variants.
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../artifacts/phase5');
const BASE_URL = 'http://localhost:3000';
const WAIT = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, name) {
  const dest = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`  ✓ ${name}.png`);
  return dest;
}

async function injectJS(page, code) {
  return page.evaluate(code);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // --- 1. Desktop lobby 1440×900 ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await WAIT(2500);
    await shot(page, 'phase5_desktop_lobby_1440x900');
    await ctx.close();
  }

  // --- 2. Mobile lobby 390×844 ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await WAIT(2500);
    await shot(page, 'phase5_mobile_lobby_390x844');
    await ctx.close();
  }

  // --- 3-8. Gameplay states at 1440×900 ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') console.warn('[page error]', msg.text().slice(0, 120));
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await WAIT(2000);

    // Start game
    const playBtn = page.locator('#play-button, .play-button, [data-action="play"], button').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await WAIT(800);
    }

    // Dismiss any intro overlay
    await page.keyboard.press('Space');
    await WAIT(500);
    await page.keyboard.press('Space');
    await WAIT(1500);

    // 3. Gameplay — normal run, ground obstacles
    await shot(page, 'phase5_gameplay_normal');

    // 4. Run a bit to reach a train
    for (let i = 0; i < 6; i++) {
      await WAIT(700);
      await shot(page, `phase5_gameplay_run_${i}`);
    }

    // 5. Capture hard mode activation (if accessible via keyboard shortcut)
    await WAIT(3000);
    await shot(page, 'phase5_gameplay_approaching_obstacles');

    // 6. Run longer
    await WAIT(4000);
    await shot(page, 'phase5_gameplay_mid_run');

    await ctx.close();
  }

  // --- 9. Hard mode via URL param ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await WAIT(2000);

    // Click play
    const playBtn = page.locator('#play-button, .play-button, button').first();
    if (await playBtn.isVisible()) await playBtn.click();
    await WAIT(800);

    // Switch to hard mode if button visible
    const hardBtn = page.locator('text=/hard/i, [data-difficulty="hard"], #hard-mode-btn').first();
    if (await hardBtn.isVisible().catch(() => false)) {
      await hardBtn.click();
      await WAIT(400);
    }

    await page.keyboard.press('Space');
    await WAIT(500);
    await page.keyboard.press('Space');
    await WAIT(3000);
    await shot(page, 'phase5_hard_mode_gameplay');

    await ctx.close();
  }

  // --- 10. Game-over modal ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await WAIT(2000);

    const playBtn = page.locator('#play-button, .play-button, button').first();
    if (await playBtn.isVisible()) await playBtn.click();
    await WAIT(600);
    await page.keyboard.press('Space');
    await WAIT(400);
    await page.keyboard.press('Space');
    await WAIT(8000); // Let player run into obstacle

    // Check for game over
    const gameOverEl = page.locator('#game-over-modal, .game-over, [data-modal="game-over"]').first();
    if (await gameOverEl.isVisible().catch(() => false)) {
      await shot(page, 'phase5_game_over');
    } else {
      await shot(page, 'phase5_late_run');
    }

    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ Phase 5 captures complete → artifacts/phase5/');
})().catch(err => {
  console.error('Capture error:', err.message);
  process.exit(1);
});
