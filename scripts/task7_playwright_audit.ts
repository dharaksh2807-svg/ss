import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function runAudit() {
  console.log('🚀 Starting Task 7 Real Browser Playwright Audit...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=metal']
  });

  const consoleErrors: string[] = [];
  const consoleWarns: string[] = [];

  // =========================================================================
  // 1. DESKTOP SESSION (1280x720)
  // =========================================================================
  console.log('\n--- 1. Desktop Session Setup (1280x720) ---');
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[Browser ERROR]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarns.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log(`[Uncaught Page Error]: ${err.message}`);
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Capture 1: Lobby Presentation
  console.log('📸 Capturing Lobby Presentation...');
  const shot1Path = path.join(ARTIFACTS_DIR, 'task7_01_lobby_presentation.png');
  await page.screenshot({ path: shot1Path });
  console.log(`✅ Saved: ${shot1Path}`);

  // Start run
  console.log('▶️ Starting Normal Run...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.startRun('NORMAL');
    // Grant extended invulnerability window for deterministic progression observation
    game.getPlayer().powerups.grantInvulnerability(90);
  });

  await page.waitForTimeout(1500);

  // Capture 2: Opening Sprint (2s)
  console.log('📸 Capturing Opening Sprint (2s)...');
  const shot2Path = path.join(ARTIFACTS_DIR, 'task7_02_opening_sprint_2s.png');
  await page.screenshot({ path: shot2Path });
  console.log(`✅ Saved: ${shot2Path}`);

  // Simulate active locomotion: Lane changes and jumps
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowUp'); // Jump
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowDown'); // Fast drop
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowRight'); // Return to center lane
  await page.waitForTimeout(400);

  // Advance to 15s
  console.log('⏳ Advancing to 15s mid-run pacing...');
  await page.waitForTimeout(9000);

  const p15 = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const player = game.getPlayer();
    return {
      distance: Math.round(player.distanceTraveled),
      speed: Math.round(player.speed * 10) / 10,
      coins: game.coinsCount,
      score: Math.round(game.score),
      state: player.state,
      lane: player.currentLane
    };
  });
  console.log(`⏱️ 15s Checkpoint: Dist=${p15.distance}m, Speed=${p15.speed}m/s, Coins=${p15.coins}, Score=${p15.score}, State=${p15.state}`);

  // Capture 3: 15s Mid-Run Pacing
  console.log('📸 Capturing Mid-Run Pacing (15s)...');
  const shot3Path = path.join(ARTIFACTS_DIR, 'task7_03_mid_run_15s.png');
  await page.screenshot({ path: shot3Path });
  console.log(`✅ Saved: ${shot3Path}`);

  // Trigger Jetpack powerup at 18s to observe aerial coin collection and flight camera
  console.log('🚀 Activating Jetpack Flight & Aerial Coin Trail...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.getPlayer().powerups.activate('JETPACK', 8);
  });

  await page.waitForTimeout(3000);

  // Capture 4: Jetpack Aerial Flight & Coin Ribbon (22s)
  console.log('📸 Capturing Jetpack Aerial Flight & Coin Ribbon...');
  const shotJetpackPath = path.join(ARTIFACTS_DIR, 'task7_04_jetpack_aerial_flight.png');
  await page.screenshot({ path: shotJetpackPath });
  console.log(`✅ Saved: ${shotJetpackPath}`);

  // Wait for jetpack descent and safe landing
  console.log('⏳ Waiting for Jetpack Safe Landing...');
  await page.waitForTimeout(6000);

  // Advance to 35s High-Speed Tier
  console.log('⏳ Advancing to 35s high-speed tier (~30 m/s)...');
  await page.waitForTimeout(5000);

  const p35 = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const player = game.getPlayer();
    return {
      distance: Math.round(player.distanceTraveled),
      speed: Math.round(player.speed * 10) / 10,
      coins: game.coinsCount,
      score: Math.round(game.score),
      state: player.state,
      lane: player.currentLane
    };
  });
  console.log(`⏱️ 35s Checkpoint: Dist=${p35.distance}m, Speed=${p35.speed}m/s, Coins=${p35.coins}, Score=${p35.score}, State=${p35.state}`);

  // Capture 5: High Speed Progression (35s)
  console.log('📸 Capturing High Speed Progression (35s)...');
  const shot35Path = path.join(ARTIFACTS_DIR, 'task7_05_high_speed_35s.png');
  await page.screenshot({ path: shot35Path });
  console.log(`✅ Saved: ${shot35Path}`);

  // Advance to 55s Late-Run Challenge
  console.log('⏳ Advancing to 55s late-run challenge gauntlet (~34 m/s)...');
  await page.waitForTimeout(12000);

  const p55 = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const player = game.getPlayer();
    return {
      distance: Math.round(player.distanceTraveled),
      speed: Math.round(player.speed * 10) / 10,
      coins: game.coinsCount,
      score: Math.round(game.score),
      state: player.state,
      lane: player.currentLane
    };
  });
  console.log(`⏱️ 55s Checkpoint: Dist=${p55.distance}m, Speed=${p55.speed}m/s, Coins=${p55.coins}, Score=${p55.score}, State=${p55.state}`);

  // Capture 6: Late-Run Gauntlet
  console.log('📸 Capturing Late-Run Gauntlet (55s)...');
  const shot55Path = path.join(ARTIFACTS_DIR, 'task7_06_late_run_gauntlet_55s.png');
  await page.screenshot({ path: shot55Path });
  console.log(`✅ Saved: ${shot55Path}`);

  // Measure Performance at HIGH preset
  const perfHigh = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    return game.getPerformanceMetrics();
  });
  console.log('\n📊 High Graphics Preset Performance:', perfHigh);

  // Trigger game over
  console.log('\n💥 Concluding run via lethal obstacle collision...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    (game.getPlayer().powerups as any).invulnerabilityTimer = 0;
    game.handleGameOver('TRAIN_COLLISION');
  });

  // Wait 1800ms for crash tumble animation (1100ms) and modal show
  await page.waitForTimeout(1800);

  // Capture 7: Game Over Modal
  console.log('📸 Capturing Game Over Modal...');
  const shotGOverPath = path.join(ARTIFACTS_DIR, 'task7_07_game_over_modal.png');
  await page.screenshot({ path: shotGOverPath });
  console.log(`✅ Saved: ${shotGOverPath}`);

  // Test Restart Responsiveness
  console.log('🔄 Testing Restart Button Responsiveness...');
  const restartBtn = page.locator('#game-over-retry-btn');
  await restartBtn.waitFor({ state: 'visible', timeout: 5000 });
  await restartBtn.click();
  await page.waitForTimeout(1500);

  const restartState = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    return {
      lifecycle: game.lifecycleState,
      playerState: game.getPlayer().state,
      speed: game.getPlayer().speed,
      distance: game.getPlayer().distanceTraveled,
      score: game.score
    };
  });
  console.log('🔄 Post-Restart State:', restartState);

  // Capture 8: Post-Restart Active Gameplay
  const shotRestartPath = path.join(ARTIFACTS_DIR, 'task7_08_restart_active_gameplay.png');
  await page.screenshot({ path: shotRestartPath });
  console.log(`✅ Saved: ${shotRestartPath}`);

  // Test Medium Graphics Preset
  console.log('\n⚙️ Applying Medium Graphics Preset...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.worldScene.setGraphicsQuality('MEDIUM');
  });
  await page.waitForTimeout(800);

  const perfMedium = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    return game.getPerformanceMetrics();
  });
  console.log('📊 Medium Graphics Preset Performance:', perfMedium);

  // Capture 9: Medium Quality Preset
  const shotMedPath = path.join(ARTIFACTS_DIR, 'task7_09_medium_quality_preset.png');
  await page.screenshot({ path: shotMedPath });
  console.log(`✅ Saved: ${shotMedPath}`);

  await context.close();

  // =========================================================================
  // 2. MOBILE PORTRAIT SESSION (390x844 - iPhone / Mobile Viewport)
  // =========================================================================
  console.log('\n--- 2. Mobile Portrait Session Setup (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Start run in mobile
  await mobilePage.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.startRun('NORMAL');
  });
  await mobilePage.waitForTimeout(1500);

  console.log('📸 Capturing Mobile Portrait Gameplay...');
  const shot10Path = path.join(ARTIFACTS_DIR, 'task7_10_mobile_portrait_gameplay.png');
  await mobilePage.screenshot({ path: shot10Path });
  console.log(`✅ Saved: ${shot10Path}`);

  await mobileContext.close();
  await browser.close();

  console.log('\n=============================================================');
  console.log('🎉 PLAYWRIGHT REAL BROWSER AUDIT COMPLETED SUCCESSFULLY!');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors logged:', consoleErrors);
  }
  console.log('=============================================================\n');

  return {
    consoleErrors,
    perfHigh,
    perfMedium,
    p15,
    p35,
    p55,
    restartState
  };
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
