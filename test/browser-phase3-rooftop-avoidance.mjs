import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching headless browser for Phase 3 Rooftop Traversal & Moving-Train Avoidance Test...');
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

  console.log('🎮 Game instance initialized. Setting up Scenario 1: Oncoming Moving Train Avoidance...');

  // Setup Scenario 1: Oncoming moving train in Lane 0, player switches to Lane 1
  const avoidanceResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('HARD');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 28.0;

    const cam = game.getCameraController();
    cam.setCameraMode('GAMEPLAY');
    cam.finishIntro(player.position);

    // Place oncoming moving train in lane 0 at Z = -60m
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE3_MOVING_DODGE',
      difficulty: 'HARD',
      obstacles: [{
        type: 'MOVING_TRAIN',
        lane: 0,
        zOffset: 60.0,
        length: 24.0,
        isMoving: true,
        velocityZ: 30.0
      }],
      collectibles: []
    }, 0);

    return { success: true };
  });

  await page.waitForTimeout(100);

  // Player reacts and switches to safe adjacent lane (Lane 1)
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.changeLane(1);
  });

  // Advance simulation by 30 frames (0.5s)
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const trackMgr = game.getTrackManager();
    for (let f = 0; f < 30; f++) {
      player.update(1 / 60);
      trackMgr.update(player, 1 / 60, 1 / 60);
    }
  });

  const screenshot1 = path.join(ARTIFACTS_DIR, 'phase3_moving_train_avoided.png');
  await page.screenshot({ path: screenshot1 });
  console.log('📸 Captured Scenario 1 Screenshot:', screenshot1);

  const scenario1Check = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      survived: player.state !== 'CRASH' && player.state !== 'DYING',
      lane: player.currentLane,
      state: player.state
    };
  });
  console.log('🔬 Scenario 1 Verification:', scenario1Check);

  // ---------------------------------------------------------------------------
  // Setup Scenario 2: Train Rooftop Traversal (Ramp Ascent -> Multi-Carriage Catwalk)
  // ---------------------------------------------------------------------------
  console.log('\n🎮 Setting up Scenario 2: Train Rooftop Traversal across Multi-Carriage Consist...');

  const rooftopResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.reset();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 22.0;

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();

    // Populate with 2-carriage consist with entry ramp and exit ramp
    chunk.populate({
      name: 'PHASE3_ROOFTOP_DEMO',
      difficulty: 'MEDIUM',
      obstacles: [{
        type: 'TRAIN_COMPOSITION',
        lane: 0,
        zOffset: 30.0,
        length: 26.0,
        hasRamp: true,
        hasExitRamp: true,
        composition: {
          id: 'demo_twin',
          name: 'Demo Twin Consist',
          difficultyTier: 'MEDIUM',
          totalLength: 26.0,
          rampLength: 8.0,
          hasRamp: true,
          hasExitRamp: true,
          carriages: [
            { id: 'lead', type: 'LOCOMOTIVE_CAB', length: 12.0, localOffsetZ: 6.0, variant: 'MODERN_METRO', hasRamp: true },
            { id: 'trail', type: 'CABOOSE_END', length: 12.0, localOffsetZ: -6.0, variant: 'MODERN_METRO', hasExitRamp: true }
          ]
        }
      }],
      collectibles: []
    }, 0);

    // Ramp base is at Z = -9.0m, ramp top is at Z = -17.0m.
    // Start player at Z = -5.0m running at 18.0 m/s toward ramp
    player.position.set(0, 0, -5.0);
    player.previousPosition.set(0, 0, -5.0);
    player.speed = 18.0;
    return { success: true };
  });

  // Advance simulation across ramp onto roof
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const trackMgr = game.getTrackManager();
    for (let f = 0; f < 45; f++) {
      player.update(1 / 60);
      trackMgr.update(player, 1 / 60, 1 / 60);
    }
  });

  const screenshot2 = path.join(ARTIFACTS_DIR, 'phase3_rooftop_traversal.png');
  await page.screenshot({ path: screenshot2 });
  console.log('📸 Captured Scenario 2 Screenshot (Rooftop Traversal):', screenshot2);

  const scenario2Check = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      supportSurface: player.getSupportSurface(),
      playerY: player.position.y,
      playerZ: player.position.z,
      state: player.state
    };
  });
  console.log('🔬 Scenario 2 Verification (On Roof):', scenario2Check);

  // Advance across rear exit ramp down to ground
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const trackMgr = game.getTrackManager();
    for (let f = 0; f < 60; f++) {
      player.update(1 / 60);
      trackMgr.update(player, 1 / 60, 1 / 60);
    }
  });

  const screenshot3 = path.join(ARTIFACTS_DIR, 'phase3_rooftop_exit.png');
  await page.screenshot({ path: screenshot3 });
  console.log('📸 Captured Scenario 3 Screenshot (Exit Descent to Ground):', screenshot3);

  const scenario3Check = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      supportSurface: player.getSupportSurface(),
      playerY: player.position.y,
      survived: player.state !== 'CRASH'
    };
  });
  console.log('🔬 Scenario 3 Verification (Safe Ground Return):', scenario3Check);

  await browser.close();

  if (!scenario1Check.survived || scenario2Check.supportSurface !== 'TRAIN_ROOF' || !scenario3Check.survived) {
    console.error('❌ Browser verification failed!');
    process.exit(1);
  }

  console.log('✨ All Phase 3 browser acceptance tests completed successfully!');
}

run().catch((err) => {
  console.error('Fatal Browser Test Error:', err);
  process.exit(1);
});
