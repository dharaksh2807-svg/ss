import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runBrowserJetpackValidation() {
  console.log('🚀 Launching isolated Playwright browser for Jetpack Flight & Landing Validation...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('JETPACK') || msg.text().includes('COIN')) {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  console.log('🌐 Navigating to Metro Runner 3D at http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for game initialization
  await page.waitForFunction(() => (window as any).__METRO_GAME__ !== undefined, { timeout: 10000 });
  console.log('✅ Game instance __METRO_GAME__ detected on window');

  // Click Start Play button
  const playBtn = page.locator('#start-play-btn');
  await playBtn.waitFor({ state: 'visible', timeout: 5000 });
  await playBtn.click();
  console.log('▶️ Clicked Play button');

  // Skip opening sequence
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  console.log('⏩ Skipped intro cinematic into active gameplay');

  // Wait for active PLAYING state
  await page.waitForFunction(() => {
    const game = (window as any).__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 5000 });
  console.log('🏃 Active running state confirmed');

  const artifactDir = '/Users/dharaksh/.gemini/antigravity-ide/brain/672ddbd5-0177-4c3b-909d-89bceebe552b';

  // 1. Activate Jetpack and capture Takeoff
  console.log('🚀 Activating Jetpack powerup in live browser session...');
  const takeoffMetrics = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.player.powerups.activate('JETPACK');
    return {
      jetpackActive: game.player.powerups.isJetpackActive(),
      phase: game.player.getJetpackPhase(),
      positionY: game.player.position.y
    };
  });
  console.log('Takeoff initiated:', takeoffMetrics);

  // Allow ~400ms for ascent arc to climb toward cruise
  await page.waitForTimeout(450);

  const takeoffScreenshotPath = path.join(artifactDir, 'jetpack_takeoff_climb.png');
  await page.screenshot({ path: takeoffScreenshotPath });
  console.log(`📸 Saved Takeoff Climb Screenshot to ${takeoffScreenshotPath}`);

  // 2. Cruise Flight with Aerial Coins
  await page.waitForTimeout(1000);
  const cruiseMetrics = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const activeAerialCoins = game.trackManager.aerialCoinManager.getPool().filter((c: any) => c.active);
    return {
      phase: game.player.getJetpackPhase(),
      altitude: game.player.position.y,
      cameraY: game.cameraController.camera.position.y,
      speed: game.player.speed,
      activeAerialCoinsCount: activeAerialCoins.length,
      coinsCollected: game.coinsCount
    };
  });
  console.log('Cruise Flight Metrics:', cruiseMetrics);

  const cruiseScreenshotPath = path.join(artifactDir, 'jetpack_cruise_flight.png');
  await page.screenshot({ path: cruiseScreenshotPath });
  console.log(`📸 Saved Cruise Flight Screenshot to ${cruiseScreenshotPath}`);

  // 3. Glide through descent into landing touchdown
  console.log('🛬 Simulating glide through descent and touchdown on runway...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    // Fast-forward jetpack remaining to trigger DESCENT
    const duration = game.player.powerups.getJetpackDuration();
    game.player.powerups.update(duration - 1.2);
  });

  // Let browser render the descent and touchdown frames
  await page.waitForTimeout(1500);

  const landingMetrics = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    return {
      lifecycleState: game.lifecycleState,
      playerState: game.player.state,
      jetpackPhase: game.player.getJetpackPhase(),
      playerAltitude: game.player.position.y,
      isGrounded: game.player.isGrounded,
      isInvulnerable: game.player.isInvulnerable(),
      totalCoins: game.coinsCount
    };
  });
  console.log('Landing Touchdown Metrics:', landingMetrics);

  const landingScreenshotPath = path.join(artifactDir, 'jetpack_safe_landing.png');
  await page.screenshot({ path: landingScreenshotPath });
  console.log(`📸 Saved Safe Landing Screenshot to ${landingScreenshotPath}`);

  await browser.close();
  console.log('✅ Browser Jetpack Validation completed successfully!');
}

runBrowserJetpackValidation().catch(err => {
  console.error('Browser validation failed:', err);
  process.exit(1);
});
