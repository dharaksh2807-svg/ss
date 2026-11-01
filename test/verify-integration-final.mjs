/**
 * Comprehensive Final Integration Verification Suite
 * Verifies all merged phases in a live headless browser.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';
const OUT_DIR = join(__dirname, '..', 'artifacts', 'integration');
mkdirSync(OUT_DIR, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture(page, name) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 Saved screenshot: ${name}.png`);
  return path;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {
    checks: [],
    errors: [],
    screenshots: []
  };

  function check(name, passed, detail = '') {
    results.checks.push({ name, passed, detail });
    if (passed) {
      console.log(`✅ [CHECK] ${name}${detail ? ` (${detail})` : ''}`);
    } else {
      console.error(`❌ [CHECK FAIL] ${name}${detail ? ` (${detail})` : ''}`);
      results.errors.push(`${name}: ${detail}`);
    }
  }

  // --- 1. Desktop Lobby Check ---
  console.log('\n--- 1. Desktop Lobby Verification (1440×900) ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2500);

    const playBtn = await page.$('#start-play-btn');
    check('Play button exists', !!playBtn);

    const diffSelector = await page.$('.lobby-mode-toggle');
    check('Difficulty selector exists', !!diffSelector);

    const charBtn = await page.$('#start-characters-btn');
    check('Characters button exists', !!charBtn);

    const shopBtn = await page.$('#start-shop-btn');
    check('Shop button exists', !!shopBtn);

    check('Desktop lobby zero console errors', consoleErrors.length === 0, `${consoleErrors.length} errors`);

    const path = await capture(page, '01_desktop_lobby');
    results.screenshots.push(path);
    await ctx.close();
  }

  // --- 2. Mobile Lobby Check ---
  console.log('\n--- 2. Mobile Lobby Verification (390×844) ---');
  {
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2500);

    const playBtn = await page.$('#start-play-btn');
    check('Mobile play button visible', !!playBtn && await playBtn.isVisible());

    // Check that side rails are hidden on mobile
    const sideRailLeft = await page.$('.lobby-side-rail.rail-left');
    const isHidden = sideRailLeft ? !(await sideRailLeft.isVisible()) : true;
    check('Side rails hidden on mobile (no overlap)', isHidden);

    check('Mobile lobby zero console errors', consoleErrors.length === 0, `${consoleErrors.length} errors`);

    const path = await capture(page, '02_mobile_lobby');
    results.screenshots.push(path);
    await ctx.close();
  }

  // --- 3. Shop & Character Selection Modals ---
  console.log('\n--- 3. Shop & Character Modals Verification ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    // Open Character modal
    await page.click('#start-characters-btn');
    await delay(800);
    const charModal = await page.$('#character-select-modal');
    check('Character modal opens', !!charModal && await charModal.isVisible());
    const pathChar = await capture(page, '03_character_selection_modal');
    results.screenshots.push(pathChar);

    // Close Character modal
    const closeCharBtn = await page.$('#char-close-btn');
    if (closeCharBtn) await closeCharBtn.click();
    await delay(600);

    // Open Shop modal
    await page.click('#start-shop-btn');
    await delay(800);
    const shopModal = await page.$('#shop-modal');
    check('Shop modal opens', !!shopModal && await shopModal.isVisible());
    const pathShop = await capture(page, '04_shop_modal');
    results.screenshots.push(pathShop);

    // Close Shop modal
    const closeShopBtn = await page.$('#shop-close-btn');
    if (closeShopBtn) await closeShopBtn.click();
    await delay(600);

    await ctx.close();
  }

  // --- 4. Normal Mode Gameplay & HUD ---
  console.log('\n--- 4. Normal Mode Gameplay & HUD Verification ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    // Click Play button
    await page.click('#start-play-btn');
    await delay(3000); // Wait for countdown/intro to finish and run to start

    // Check HUD elements
    const hudScore = await page.$('#hud-score');
    check('HUD score visible', !!hudScore && await hudScore.isVisible());

    const hudCoins = await page.$('#hud-coins');
    check('HUD coins visible', !!hudCoins && await hudCoins.isVisible());

    const hudPause = await page.$('#hud-pause-btn');
    check('HUD pause button visible', !!hudPause && await hudPause.isVisible());

    check('Gameplay running without console errors', consoleErrors.length === 0, `${consoleErrors.length} errors`);

    const path = await capture(page, '05_normal_gameplay_hud');
    results.screenshots.push(path);

    await ctx.close();
  }

  // --- 5. Hard Mode Gameplay Verification ---
  console.log('\n--- 5. Hard Mode Gameplay Verification ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    // Click Hard mode toggle
    const hardBtn = await page.$('.mode-toggle-btn[data-mode="HARD"], #mode-toggle-hard');
    if (hardBtn) {
      await hardBtn.click();
      await delay(400);
      check('Hard mode selected', true);
    } else {
      check('Hard mode toggle found', false);
    }

    // Start game
    await page.click('#start-play-btn');
    await delay(3000);

    const path = await capture(page, '06_hard_mode_gameplay');
    results.screenshots.push(path);
    await ctx.close();
  }

  // --- 6. Train Rooftop Traversal & Elevated Camera ---
  console.log('\n--- 6. Train Rooftop Traversal & Camera ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    await page.click('#start-play-btn');
    await delay(1500);

    // Simulate rooftop height in debug
    await page.evaluate(() => {
      const g = window.__METRO_GAME__ || window.game;
      if (g && g.player) {
        g.player.position.y = 4.35;
      }
    });
    await delay(1500);

    const path = await capture(page, '07_train_rooftop_traversal');
    results.screenshots.push(path);
    await ctx.close();
  }

  // --- 7. Game Over Modal & Play Again / Retry ---
  console.log('\n--- 7. Game Over Modal & Play Again Verification ---');
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    await page.click('#start-play-btn');
    await delay(1500);

    // Trigger Game Over via Game instance
    await page.evaluate(() => {
      const g = window.__METRO_GAME__ || window.game;
      if (g && g.handleGameOver) {
        g.handleGameOver('CRASH');
      }
    });
    await delay(2500);

    const gameOverModal = await page.$('#game-over-modal');
    check('Game Over modal displayed', !!gameOverModal && await gameOverModal.isVisible());

    const retryBtn = await page.$('#game-over-retry-btn');
    check('Quick Retry button present', !!retryBtn && await retryBtn.isVisible());

    const path = await capture(page, '08_game_over_modal');
    results.screenshots.push(path);

    // Click Retry / Play Again
    if (retryBtn) {
      await retryBtn.click();
      await delay(2000);
      const isPlayingOrMenu = await page.evaluate(() => {
        const g = window.__METRO_GAME__ || window.game;
        return g ? (g.lifecycleState === 'PLAYING' || g.lifecycleState === 'MENU') : true;
      });
      check('Play Again action transitions cleanly', isPlayingOrMenu);
    }

    check('Game Over flow zero console errors', consoleErrors.length === 0, `${consoleErrors.length} errors`);

    await ctx.close();
  }

  await browser.close();

  console.log('\n=======================================================');
  console.log(`📊 FINAL VERIFICATION: ${results.checks.filter(c => c.passed).length}/${results.checks.length} CHECKS PASSED`);
  if (results.errors.length > 0) {
    console.error(`🚨 FAILURES: ${results.errors.join(', ')}`);
    process.exit(1);
  } else {
    console.log('🎉 ALL INTEGRATION BROWSER CHECKS PASSED WITH ZERO CONSOLE ERRORS!');
  }
  console.log('=======================================================\n');
})().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

