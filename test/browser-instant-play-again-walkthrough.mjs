import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
const BRAIN_ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity/brain/8b70b6a8-e6e7-431c-b23c-023a1c122eff';

if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_ARTIFACTS_DIR)) fs.mkdirSync(BRAIN_ARTIFACTS_DIR, { recursive: true });

async function saveScreenshot(page, filename) {
  const localPath = path.join(ARTIFACTS_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACTS_DIR, filename);
  await page.screenshot({ path: localPath });
  fs.copyFileSync(localPath, brainPath);
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function run() {
  console.log('🚀 Metro Runner 3D: Real-Browser Instant Play Again Walkthrough...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('AudioContext')) return; // Ignore headless virtual audio device notice
      console.error('Browser Error:', text);
      consoleErrors.push(text);
    }
  });

  // 1. Load Page & Verify Start Screen
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);
  console.log('✅ WebGL game loaded successfully');

  // Track if page ever reloaded or navigated
  await page.evaluate(() => {
    window.__PAGE_STABLE_UUID__ = 'METRO_RUNNER_STABLE_INSTANCE';
  });

  // 2. Start Run 1 via Play Now button
  console.log('🎮 Starting Run 1 from Start Screen...');
  const playBtn = page.locator('#start-play-btn');
  await playBtn.click();
  await page.waitForTimeout(200);

  // Skip cinematic intro to enter normal gameplay
  await page.evaluate(() => {
    window.__METRO_GAME__.getOpeningSequence().skip();
  });
  await page.waitForTimeout(400);

  // Simulate some forward movement & score accumulation
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.z -= 80;
    player.distanceTraveled += 80;
    game.score = 1200;
    game.coinsCount = 8;
  });

  // 3. Trigger Fatal Collision in Run 1
  console.log('💥 Inducing fatal collision in Run 1...');
  await page.evaluate(() => {
    window.__METRO_GAME__.getPlayer().crash('TRAIN_FRONT');
  });

  // Wait for Revive Modal and click "End Run & Collect" to proceed to Game Over
  await page.waitForSelector('#revive-modal:not(.hidden)', { timeout: 3000 });
  console.log('🔑 Revive modal appeared; declining revive to reach Game Over...');
  const endRunBtn = page.locator('#revive-end-run-btn');
  await endRunBtn.click();
  await page.waitForTimeout(400);

  // 4. Verify Game Over Screen Elements
  await page.waitForSelector('#game-over-modal:not(.hidden)', { timeout: 3000 });
  console.log('🏆 Game Over modal displayed');

  const retryBtn = page.locator('#game-over-retry-btn');
  const menuBtn = page.locator('#game-over-menu-btn');
  const retryText = await retryBtn.innerText();
  const menuText = await menuBtn.innerText();

  console.log(`  Primary Button: "${retryText.trim()}"`);
  console.log(`  Secondary Button: "${menuText.trim()}"`);

  if (!retryText.includes('PLAY AGAIN')) {
    throw new Error(`Expected primary button to be "PLAY AGAIN", got "${retryText}"`);
  }
  if (!menuText.includes('MAIN MENU')) {
    throw new Error(`Expected secondary button to be "MAIN MENU", got "${menuText}"`);
  }

  await saveScreenshot(page, 'play_again_game_over_screen.png');

  // 5. Click Play Again to Start Run 2 Directly
  console.log('\n🔄 Activating Play Again for Run 2...');
  await page.keyboard.press('r'); // Test keyboard quick retry or direct activation
  await page.waitForTimeout(600);

  // Verify modal is hidden
  const isGameOverHidden = await page.locator('#game-over-modal.hidden').count();
  console.log(`✅ Game Over modal hidden: ${isGameOverHidden > 0}`);

  // Verify Run 2 state directly
  const run2State = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      stableUuid: window.__PAGE_STABLE_UUID__,
      lifecycleState: game.lifecycleState,
      playerState: player.state,
      lane: player.lane,
      posX: player.position.x,
      posY: player.position.y,
      posZ: player.position.z,
      score: game.score,
      coins: game.coinsCount,
      distance: player.distanceTraveled,
      isInvulnerable: player.isInvulnerable()
    };
  });

  console.log('📊 Run 2 Initial Telemetry:', run2State);

  if (run2State.stableUuid !== 'METRO_RUNNER_STABLE_INSTANCE') {
    throw new Error('Webpage reloaded! Play Again must NOT reload the page.');
  }
  if (run2State.lifecycleState !== 'PLAYING') {
    throw new Error(`Expected lifecycle PLAYING, got ${run2State.lifecycleState}`);
  }
  if (run2State.lane !== 0 || run2State.posX !== 0) {
    throw new Error(`Expected lane 0 and posX 0, got lane ${run2State.lane}, posX ${run2State.posX}`);
  }
  if (run2State.score >= 1200) {
    throw new Error(`Expected score to be reset from 1200, but got ${run2State.score}`);
  }

  await saveScreenshot(page, 'play_again_run2_start.png');

  // 6. Advance Run 2 and Trigger Second Collision
  console.log('\n🏃 Advancing Run 2 and triggering second fatal collision...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.z -= 120;
    player.distanceTraveled += 120;
    game.score = 2400;
    player.crash('OBSTACLE_WALL');
  });

  // Decline revive offer again
  await page.waitForSelector('#revive-modal:not(.hidden)', { timeout: 3000 });
  await page.locator('#revive-end-run-btn').click();
  await page.waitForTimeout(400);

  await page.waitForSelector('#game-over-modal:not(.hidden)', { timeout: 3000 });
  console.log('🏆 Second Game Over modal displayed');

  // 7. Click Play Again (Mouse Click on Retry Button)
  console.log('🔄 Activating Play Again via button click for Run 3...');
  await page.evaluate(() => {
    document.getElementById('game-over-retry-btn').click();
  });
  await page.waitForTimeout(600);

  const run3State = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      stableUuid: window.__PAGE_STABLE_UUID__,
      lifecycleState: game.lifecycleState,
      playerState: player.state,
      lane: player.lane,
      score: game.score,
      distance: player.distanceTraveled
    };
  });
  console.log('📊 Run 3 Initial Telemetry:', run3State);

  if (run3State.lifecycleState !== 'PLAYING') {
    throw new Error(`Run 3 failed to start! Got lifecycle: ${run3State.lifecycleState}`);
  }

  await saveScreenshot(page, 'play_again_run3_start.png');

  await browser.close();

  console.log('\n=============================================================');
  console.log('🏆 REAL BROWSER WALKTHROUGH COMPLETE: ALL STAGES VERIFIED');
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log('=============================================================\n');

  if (consoleErrors.length > 0) {
    throw new Error(`Encountered ${consoleErrors.length} browser errors during walkthrough`);
  }
}

run().catch((err) => {
  console.error('Walkthrough script failed:', err);
  process.exit(1);
});

