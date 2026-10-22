import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function captureTask4Jetpack() {
  console.log('🚀 Starting Task 4 Jetpack Visual Capture with Playwright...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Start normal run
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
  });
  await page.waitForTimeout(600);

  // -------------------------------------------------------------
  // SHOT 1: Takeoff Ascent Arc
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Takeoff Ascent Arc...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.powerups.activate('JETPACK');
    // Step a few frames into takeoff
    for (let i = 0; i < 15; i++) {
      player.update(0.016);
      game.getTrackManager().update(player, 0.016, 0.016 * i);
      game.getCameraController().update(player.position, 0.016, 0.016 * i, player.speed, player.groundY);
    }
  });
  await page.waitForTimeout(300);
  const shot1 = path.join(ARTIFACT_DIR, 'task4_01_takeoff_ascent.png');
  await page.screenshot({ path: shot1 });

  // -------------------------------------------------------------
  // SHOT 2: Cruise Flight & Aerial Coin Trail
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Cruise Flight & Aerial Coin Trail...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    // Step forward into full CRUISE phase
    for (let i = 0; i < 40; i++) {
      player.update(0.02);
      game.getTrackManager().update(player, 0.02, 0.02 * i);
      game.getCameraController().update(player.position, 0.02, 0.02 * i, player.speed, player.groundY);
    }
  });
  await page.waitForTimeout(300);
  const shot2 = path.join(ARTIFACT_DIR, 'task4_02_cruise_coin_trail.png');
  await page.screenshot({ path: shot2 });

  // -------------------------------------------------------------
  // SHOT 3: Lateral Steering & Aerial S-Curve
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Lateral Steering & S-Curve Lane Switch...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.handleInput('LEFT');
    // Step frames to show banking and lateral transit
    for (let i = 0; i < 12; i++) {
      player.update(0.016);
      game.getTrackManager().update(player, 0.016, 0.016 * i);
      game.getCameraController().update(player.position, 0.016, 0.016 * i, player.speed, player.groundY);
    }
  });
  await page.waitForTimeout(300);
  const shot3 = path.join(ARTIFACT_DIR, 'task4_03_aerial_scurve_steering.png');
  await page.screenshot({ path: shot3 });

  // -------------------------------------------------------------
  // SHOT 4: Descent Glide Slope
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: Descent Glide Slope...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    // Advance powerup remaining timer to descent window (1.2s remaining)
    const powerups = player.powerups;
    const jp = powerups.getActivePowerups().find(p => p.type === 'JETPACK');
    if (jp) {
      jp.remaining = 1.2;
    }
    for (let i = 0; i < 20; i++) {
      player.update(0.02);
      game.getTrackManager().update(player, 0.02, 0.02 * i);
      game.getCameraController().update(player.position, 0.02, 0.02 * i, player.speed, player.groundY);
    }
  });
  await page.waitForTimeout(300);
  const shot4 = path.join(ARTIFACT_DIR, 'task4_04_descent_glide_slope.png');
  await page.screenshot({ path: shot4 });

  // -------------------------------------------------------------
  // SHOT 5: Safe Landing Runway Touchdown
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: Safe Landing Touchdown...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    // Steer back to center lane for clear runway view
    player.handleInput('RIGHT');
    game.getTrackManager().prepareSafeLandingRunway(player);

    // Advance powerup to expire and land
    const powerups = player.powerups;
    const jp = powerups.getActivePowerups().find(p => p.type === 'JETPACK');
    if (jp) {
      jp.remaining = 0;
    }

    // Step frames through touchdown absorption and camera ground return
    for (let i = 0; i < 25; i++) {
      player.update(0.016);
      game.getTrackManager().update(player, 0.016, 0.016 * i);
      game.getCameraController().update(player.position, 0.016, 0.016 * i, player.speed, player.groundY);
    }
  });
  await page.waitForTimeout(300);
  const shot5 = path.join(ARTIFACT_DIR, 'task4_05_safe_landing_touchdown.png');
  await page.screenshot({ path: shot5 });

  console.log('✅ All 5 Task 4 visual diagnostic shots captured successfully!');
  await browser.close();
}

captureTask4Jetpack().catch((err) => {
  console.error('❌ Error during Task 4 visual capture:', err);
  process.exit(1);
});
