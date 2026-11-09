import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/phase9');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  console.log('🚀 Launching Chromium for Phase 9 UX & Audio Audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // 1. Initial Load & Start Screen
  console.log('📸 1. Capturing Initial Start Screen (Lobby)...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01_initial_load.png') });

  // 2. Character Select Modal
  console.log('📸 2. Capturing Character Select Modal...');
  await page.click('#start-characters-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '02_character_select.png') });
  await page.click('#char-close-btn');
  await page.waitForTimeout(300);

  // 3. Environment Select Modal
  console.log('📸 3. Capturing Environment Select Modal...');
  await page.click('#start-worlds-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '03_environment_select.png') });
  await page.click('#env-close-btn');
  await page.waitForTimeout(300);

  // 4. Settings Modal
  console.log('📸 4. Capturing Settings Modal...');
  await page.click('#start-settings-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '04_settings_modal.png') });
  await page.click('#settings-close-btn');
  await page.waitForTimeout(300);

  // 5. Start Run & In-Game HUD
  console.log('📸 5. Starting Run & Capturing In-Game HUD...');
  await page.click('#start-play-btn');
  await page.waitForTimeout(1000); // 1s into run
  await page.screenshot({ path: path.join(OUT_DIR, '05_gameplay_start.png') });

  // 6. Power-up Activated & Skill Combo
  console.log('📸 6. Triggering Power-up and Skill Combo...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game?.player) {
      game.player.changeLane(1); // switch to clear lane
    }
    if (game?.powerupManager) {
      game.powerupManager.activatePowerup('MAGNET', 15);
    }
    if (game?.skillComboManager) {
      game.skillComboManager.registerEvent('PERFECT_JUMP');
      game.skillComboManager.registerEvent('TRAIN_SURF');
      game.skillComboManager.registerEvent('NEAR_MISS');
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '06_gameplay_powerup.png') });

  // 7. Approaching Train Hazard Visual Cue
  console.log('📸 7. Simulating Approaching Train Hazard...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game?.eventBus) {
      game.eventBus.emit('HAZARD_ALERT', '⚠️ TRAIN INCOMING — LANE 2');
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, '07_gameplay_train.png') });

  // 8. Crash & Game Over Screen
  console.log('📸 8. Triggering Crash & Game Over Modal...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.handleFatalCrash('TRAIN_BODY');
      game.skipDeathOrGameOverDelay();
    }
  });
  await page.waitForTimeout(400);
  const endRunBtn = await page.$('#revive-end-run-btn');
  if (endRunBtn && await endRunBtn.isVisible()) {
    console.log('  Declining revive to view Game Over screen...');
    await endRunBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '08_game_over.png') });

  // 9. Mobile Viewport (iPhone 12 / 14 390x844)
  console.log('📸 9. Capturing Mobile Viewport Start Screen...');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '09_mobile_viewport.png') });

  // 10. Mobile Viewport Gameplay HUD
  console.log('📸 10. Capturing Mobile Viewport Gameplay HUD...');
  await mobilePage.click('#start-play-btn');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '10_mobile_gameplay.png') });

  await browser.close();
  console.log('✅ Phase 9 UX & Audio audit captures completed successfully!');
})();

