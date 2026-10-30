import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
const BRAIN_ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity/brain/8b70b6a8-e6e7-431c-b23c-023a1c122eff';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}
if (!fs.existsSync(BRAIN_ARTIFACTS_DIR)) {
  fs.mkdirSync(BRAIN_ARTIFACTS_DIR, { recursive: true });
}

async function saveScreenshot(page, filename) {
  const localPath = path.join(ARTIFACTS_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACTS_DIR, filename);
  await page.screenshot({ path: localPath });
  fs.copyFileSync(localPath, brainPath);
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function run() {
  console.log('🚀 Launching headless browser for Phase 5 Visual Readability & Quality Audit...');

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

  // =========================================================================
  // Scenario 1: Normal Mode Gameplay & Baseline Readability
  // =========================================================================
  console.log('\n🎮 Scenario 1: Normal Mode Baseline Readability...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 19.0;

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_NORMAL_BASELINE',
      difficulty: 'EASY',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 1, zOffset: 32.0, variant: 0 },
        { type: 'STATIONARY_TRAIN', lane: -1, zOffset: 45.0, length: 24.0, hasRamp: true }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 12.0 },
        { type: 'COIN', lane: 0, zOffset: 16.0 },
        { type: 'COIN', lane: 0, zOffset: 20.0 },
        { type: 'COIN', lane: 0, zOffset: 24.0 }
      ]
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_normal_mode.png');

  // =========================================================================
  // Scenario 2: Hard Mode Readability & Dynamic Speed FOV
  // =========================================================================
  console.log('\n⚡ Scenario 2: Hard Mode High-Speed Readability (38+ m/s)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('HARD');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 42.0; // High speed in Hard Mode

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_HARD_VIEW',
      difficulty: 'HARD',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 40.0, variant: 1 },
        { type: 'HIGH_BARRIER', lane: 1, zOffset: 55.0, variant: 0 }
      ],
      collectibles: []
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_hard_mode.png');

  // =========================================================================
  // Scenario 3: Low Hurdle Near (Jump Warning Framing & Solid Construction)
  // =========================================================================
  console.log('\n🚧 Scenario 3: Low Hurdle Near Distance (16m)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 20.0;

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_HURDLE_NEAR',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 16.0, variant: 0 },
        { type: 'LOW_BARRIER', lane: 1, zOffset: 24.0, variant: 1 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 12.0, yOffset: 0.8 },
        { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 2.2 },
        { type: 'COIN', lane: 0, zOffset: 20.0, yOffset: 0.8 }
      ]
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_low_hurdle_near.png');

  // =========================================================================
  // Scenario 4: Low Hurdle Far (Long-Range Contrast against Sleepers)
  // =========================================================================
  console.log('\n🔭 Scenario 4: Low Hurdle Far Distance (45m)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_HURDLE_FAR',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 46.0, variant: 0 },
        { type: 'LOW_BARRIER', lane: -1, zOffset: 46.0, variant: 2 }
      ],
      collectibles: []
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_low_hurdle_far.png');

  // =========================================================================
  // Scenario 5: High Slide-Only Barrier (Gantry Opening & Warning Teeth)
  // =========================================================================
  console.log('\n📐 Scenario 5: High Overhead Slide-Only Barrier (20m)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_HIGH_BARRIER_APPROACH',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'HIGH_BARRIER', lane: 0, zOffset: 20.0, variant: 0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 15.0, yOffset: 0.4 },
        { type: 'COIN', lane: 0, zOffset: 20.0, yOffset: 0.4 },
        { type: 'COIN', lane: 0, zOffset: 25.0, yOffset: 0.4 }
      ]
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_high_slide_barrier.png');

  // =========================================================================
  // Scenario 6: Oncoming Moving Train in Hard Mode (Adjacent Lane)
  // =========================================================================
  console.log('\n🚆 Scenario 6: Oncoming Moving Train in Adjacent Lane (Hard Mode)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('HARD');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 30.0;

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_ONCOMING_TRAIN',
      difficulty: 'HARD',
      obstacles: [
        {
          type: 'MOVING_TRAIN',
          lane: 1,
          zOffset: 45.0,
          length: 24.0,
          isMoving: true,
          velocityZ: 32.0
        }
      ],
      collectibles: []
    }, 0);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_oncoming_train_hard.png');

  // =========================================================================
  // Scenario 7: Train Rooftop Gameplay (Elevated Catwalk & Extended Lookahead)
  // =========================================================================
  console.log('\n🏃 Scenario 7: Train Rooftop Gameplay Perspective...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.reset();
    player.currentLane = 0;
    player.targetLane = 0;
    player.speed = 22.0;

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_ROOFTOP_RUN',
      difficulty: 'MEDIUM',
      obstacles: [{
        type: 'TRAIN_COMPOSITION',
        lane: 0,
        zOffset: 30.0,
        length: 36.0,
        hasRamp: true,
        hasExitRamp: true,
        composition: {
          id: 'p5_long_consist',
          name: 'P5 Consist',
          difficultyTier: 'MEDIUM',
          totalLength: 36.0,
          rampLength: 8.0,
          hasRamp: true,
          hasExitRamp: true,
          carriages: [
            { id: 'c1', type: 'LOCOMOTIVE_CAB', length: 12.0, localOffsetZ: 12.0, variant: 'MODERN_METRO', hasRamp: true },
            { id: 'c2', type: 'INTERMEDIATE_CARRIAGE', length: 12.0, localOffsetZ: 0.0, variant: 'MODERN_METRO' },
            { id: 'c3', type: 'CABOOSE_END', length: 12.0, localOffsetZ: -12.0, variant: 'MODERN_METRO', hasExitRamp: true }
          ]
        }
      }],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 25.0, yOffset: 4.8 },
        { type: 'COIN', lane: 0, zOffset: 30.0, yOffset: 4.8 },
        { type: 'COIN', lane: 0, zOffset: 35.0, yOffset: 4.8 }
      ]
    }, 0);

    // Place runner directly on roof catwalk
    player.position.set(0, 4.35, -28.0);
    player.previousPosition.copy(player.position);
    player.resolveRoofLanding(4.35, 'TRAIN_ROOF_0', 'ROOF_GROUP');

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);
    cam.update(player.position, 1 / 60, 0, player.speed, 4.35, false, false);
  });

  await page.waitForTimeout(300);
  await saveScreenshot(page, 'phase5_rooftop_gameplay.png');

  // =========================================================================
  // Scenario 8: Active & Expiring Power-Ups (Compact HUD Stack, Decimal Timer)
  // =========================================================================
  console.log('\n✨ Scenario 8: Active & Expiring Power-Ups in HUD...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.reset();
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);

    // Activate multiple powerups
    player.powerups.activate('MAGNET');
    player.powerups.activate('SNEAKERS');
    player.hoverboardManager.grantPracticeCharge();
    player.hoverboardManager.activate();

    // Set Sneakers to expiring critical state (1.6s remaining)
    const sneakersItem = player.powerups.getActivePowerups().find(p => p.type === 'SNEAKERS');
    if (sneakersItem) {
      sneakersItem.remaining = 1.6;
    }
  });

  await page.waitForTimeout(200);
  await saveScreenshot(page, 'phase5_active_and_expiring_powerups.png');

  // =========================================================================
  // Scenario 9: Underground Dark Tunnel Readability
  // =========================================================================
  console.log('\n🚇 Scenario 9: Underground Dark Tunnel Environment Readability...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.reset();
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);

    // Switch to Underground Metro District
    if (window.__DEV_SET_DISTRICT__) {
      window.__DEV_SET_DISTRICT__('UNDERGROUND_METRO');
    }

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_TUNNEL_READABILITY',
      difficulty: 'MEDIUM',
      isTunnel: true,
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0, variant: 0 },
        { type: 'HIGH_BARRIER', lane: 1, zOffset: 40.0, variant: 1 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 12.0 },
        { type: 'COIN', lane: 0, zOffset: 16.0 },
        { type: 'COIN', lane: 0, zOffset: 20.0 }
      ]
    }, 0, 'UNDERGROUND_METRO');
  });

  await page.waitForTimeout(400);
  await saveScreenshot(page, 'phase5_dark_tunnel_readability.png');

  // =========================================================================
  // Scenario 10: Mobile Portrait Viewport (390 x 844)
  // =========================================================================
  console.log('\n📱 Scenario 10: Mobile Portrait Viewport (390 x 844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (window.__DEV_SET_DISTRICT__) {
      window.__DEV_SET_DISTRICT__('MODERN_METRO');
    }
    const player = game.getPlayer();
    player.reset();
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);

    player.powerups.activate('MAGNET');
    player.hoverboardManager.grantPracticeCharge();
    player.hoverboardManager.activate();

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'PHASE5_MOBILE_PORTRAIT',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 22.0, variant: 0 },
        { type: 'HIGH_BARRIER', lane: 1, zOffset: 38.0, variant: 0 }
      ],
      collectibles: []
    }, 0, 'MODERN_METRO');
  });

  await page.waitForTimeout(400);
  await saveScreenshot(page, 'phase5_mobile_layout.png');

  await browser.close();
  console.log('\n🎉 Phase 5 Visual Readability browser acceptance run completed successfully!');
}

run().catch((err) => {
  console.error('Fatal Error during Phase 5 browser test:', err);
  process.exit(1);
});

