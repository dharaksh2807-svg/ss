import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching headless browser for Phase 4 Jetpack Cruise & Landing Walkthrough...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('Browser Error:', msg.text());
  });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);

  console.log('🎮 Game instance initialized. Setting up Scenario 1: Jetpack Takeoff & Cruise...');

  // Setup Jetpack cruise flight
  const flightState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0.9, -50);
    player.previousPosition.copy(player.position);
    player.speed = 22.0;

    const cam = game.getCameraController();
    cam.setCameraMode('GAMEPLAY');
    cam.finishIntro(player.position);

    // Activate Jetpack
    player.powerups.activate('JETPACK');
    game.getTrackManager().aerialCoinManager.onJetpackActivated(player);

    // Advance 60 frames into cruise flight
    for (let f = 0; f < 60; f++) {
      player.update(1 / 60);
      game.getTrackManager().update(player, 1 / 60, performance.now() / 1000);
      cam.update(1 / 60, player, false, false);
    }

    return {
      jetpackActive: player.powerups.isJetpackActive(),
      phase: player.getJetpackPhase(),
      altitude: player.position.y,
      state: player.state
    };
  });

  console.log('🔬 Jetpack Flight Status:', flightState);
  await page.waitForTimeout(200);

  const cruiseScreenshotPath = path.join(ARTIFACTS_DIR, 'phase4_jetpack_cruise.png');
  await page.screenshot({ path: cruiseScreenshotPath });
  console.log(`📸 Captured Scenario 1 Screenshot (Jetpack Cruise): ${cruiseScreenshotPath}`);

  console.log('🎮 Setting up Scenario 2: Jetpack Descent & Touchdown...');

  // Transition into descent and touchdown
  const landingState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const cam = game.getCameraController();

    // Trigger descent by setting remaining duration to 1.5s
    const jp = player.powerups.activePowerups.get('JETPACK');
    if (jp) {
      jp.remaining = 1.0;
    }

    // Step frames through descent until touchdown
    for (let f = 0; f < 75; f++) {
      player.update(1 / 60);
      game.getTrackManager().update(player, 1 / 60, performance.now() / 1000);
      cam.update(1 / 60, player, false, false);
      if (player.getJetpackPhase() === 'SAFE_LANDING' || player.getJetpackPhase() === 'NONE') {
        break;
      }
    }

    return {
      jetpackActive: player.powerups.isJetpackActive(),
      phase: player.getJetpackPhase(),
      y: player.position.y,
      groundY: player.groundY,
      state: player.state,
      invulnerable: player.isInvulnerable()
    };
  });

  console.log('🔬 Jetpack Touchdown Status:', landingState);
  await page.waitForTimeout(200);

  const landingScreenshotPath = path.join(ARTIFACTS_DIR, 'phase4_jetpack_landing.png');
  await page.screenshot({ path: landingScreenshotPath });
  console.log(`📸 Captured Scenario 2 Screenshot (Jetpack Landing): ${landingScreenshotPath}`);

  await browser.close();
  console.log('✨ All Phase 4 browser walkthroughs completed successfully!');
}

run().catch((err) => {
  console.error('Fatal error in Phase 4 browser test:', err);
  process.exit(1);
});
