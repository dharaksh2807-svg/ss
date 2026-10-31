import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const LOCAL_ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts/baseline');
const BRAIN_ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity/brain/ed98c619-7c7e-4441-ac29-91065291cda9';

if (!fs.existsSync(LOCAL_ARTIFACTS_DIR)) {
  fs.mkdirSync(LOCAL_ARTIFACTS_DIR, { recursive: true });
}
if (!fs.existsSync(BRAIN_ARTIFACTS_DIR)) {
  fs.mkdirSync(BRAIN_ARTIFACTS_DIR, { recursive: true });
}

async function saveScreenshot(page, filename) {
  const localPath = path.join(LOCAL_ARTIFACTS_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACTS_DIR, filename);
  await page.screenshot({ path: localPath });
  fs.copyFileSync(localPath, brainPath);
  console.log(`📸 Saved screenshot: ${filename}`);
  return { localPath, brainPath };
}

async function sampleTelemetry(page, framesToSample = 60) {
  return await page.evaluate(async (sampleCount) => {
    const game = window.__METRO_GAME__;
    if (!game) return { error: 'Game instance not found' };

    const renderer = game.worldScene?.renderer;

    const frameTimes = [];
    const drawCalls = [];
    const triangles = [];

    let prev = performance.now();
    for (let i = 0; i < sampleCount; i++) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now();
      const dt = now - prev;
      prev = now;
      if (i > 5) {
        frameTimes.push(dt);
        if (renderer?.info) {
          drawCalls.push(renderer.info.render.calls);
          triangles.push(renderer.info.render.triangles);
        }
      }
    }

    frameTimes.sort((a, b) => a - b);
    const meanDt = frameTimes.length > 0 ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length : 16.6;
    const p50 = frameTimes.length > 0 ? frameTimes[Math.floor(frameTimes.length * 0.50)] : 16.6;
    const p95 = frameTimes.length > 0 ? frameTimes[Math.floor(frameTimes.length * 0.95)] : 16.6;
    const p99 = frameTimes.length > 0 ? frameTimes[Math.floor(frameTimes.length * 0.99)] : 16.6;
    const maxDt = frameTimes.length > 0 ? frameTimes[frameTimes.length - 1] : 16.6;

    const avgDrawCalls = drawCalls.length > 0 ? Math.round(drawCalls.reduce((a, b) => a + b, 0) / drawCalls.length) : (renderer?.info?.render?.calls || 0);
    const avgTriangles = triangles.length > 0 ? Math.round(triangles.reduce((a, b) => a + b, 0) / triangles.length) : (renderer?.info?.render?.triangles || 0);

    const preset = localStorage.getItem('metro_graphics_preset') || 'AUTO';
    const width = renderer?.domElement?.width || window.innerWidth;
    const height = renderer?.domElement?.height || window.innerHeight;
    const pixelRatio = renderer?.getPixelRatio ? renderer.getPixelRatio() : window.devicePixelRatio;

    return {
      fps: Math.round(1000 / meanDt),
      meanFrameTimeMs: Number(meanDt.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
      maxFrameTimeMs: Number(maxDt.toFixed(2)),
      drawCalls: avgDrawCalls,
      triangles: avgTriangles,
      renderResolution: `${width} × ${height}`,
      pixelRatio,
      currentGraphicsPreset: preset,
      geometries: renderer?.info?.memory?.geometries || 0,
      textures: renderer?.info?.memory?.textures || 0
    };
  }, framesToSample);
}

async function run() {
  console.log('🚀 Launching Chrome for Metro Runner 3D Phase 0 Baseline Captures...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const baselineData = {
    capturedAt: new Date().toISOString(),
    gitCommit: 'b4b4ebf5',
    states: {}
  };

  const consoleErrors = [];

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('AudioContext')) {
        console.error('Browser Error:', text);
        consoleErrors.push(text);
      }
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem('metro_runner_wallet', '24500');
    localStorage.setItem('metro_runner_keys', '12');
    localStorage.setItem('metro_runner_hoverboard_charges', '5');
    localStorage.setItem('metro_surf_high_score', '84200');
  });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);
  await page.waitForTimeout(600);

  // =========================================================================
  // State 1: Desktop Lobby (1440 × 900)
  // =========================================================================
  console.log('\n--- State 1: Desktop Lobby (1440 × 900) ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);

  const lobbyTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.desktopLobby = {
    ...lobbyTelemetry,
    consoleErrors: [...consoleErrors]
  };
  await saveScreenshot(page, '01_desktop_lobby_1440x900.png');

  // =========================================================================
  // State 2: Mobile Lobby (390 × 844)
  // =========================================================================
  console.log('\n--- State 2: Mobile Lobby (390 × 844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);

  const mobileLobbyTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.mobileLobby = {
    ...mobileLobbyTelemetry,
    consoleErrors: [...consoleErrors]
  };
  await saveScreenshot(page, '02_mobile_lobby_390x844.png');

  // Restore Desktop Viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);

  // =========================================================================
  // State 3: Normal Gameplay (1440 × 900)
  // =========================================================================
  console.log('\n--- State 3: Normal Gameplay ---');
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
      name: 'BASELINE_NORMAL',
      difficulty: 'EASY',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 1, zOffset: 26.0, variant: 0 },
        { type: 'STATIONARY_TRAIN', lane: -1, zOffset: 38.0, length: 24.0, hasRamp: true }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 10.0 },
        { type: 'COIN', lane: 0, zOffset: 14.0 },
        { type: 'COIN', lane: 0, zOffset: 18.0 },
        { type: 'COIN', lane: 0, zOffset: 22.0 }
      ]
    }, 0);
  });

  await page.waitForTimeout(400);
  const normalGameplayTelemetry = await sampleTelemetry(page, 50);
  baselineData.states.normalGameplay = {
    ...normalGameplayTelemetry
  };
  await saveScreenshot(page, '03_normal_gameplay.png');

  // =========================================================================
  // State 4: Hard Mode Gameplay with Approaching Trains
  // =========================================================================
  console.log('\n--- State 4: Hard Mode Gameplay with Approaching Trains ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('HARD');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 38.0;

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'BASELINE_HARD_MODE',
      difficulty: 'HARD',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 1, zOffset: 32.0, variant: 1 },
        { type: 'TRAIN', lane: 0, zOffset: 52.0, length: 48.0, isMoving: true, velocityZ: 14.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: -1, zOffset: 16.0 },
        { type: 'COIN', lane: -1, zOffset: 20.0 },
        { type: 'COIN', lane: -1, zOffset: 24.0 }
      ]
    }, 0);
  });

  await page.waitForTimeout(400);
  const hardModeTelemetry = await sampleTelemetry(page, 50);
  baselineData.states.hardModeApproachingTrain = {
    ...hardModeTelemetry
  };
  await saveScreenshot(page, '04_hard_mode_approaching_train.png');

  // =========================================================================
  // State 5: Running on a Train Roof
  // =========================================================================
  console.log('\n--- State 5: Running on a Train Roof ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'BASELINE_ROOFTOP',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'TRAIN', lane: 0, zOffset: -10.0, length: 90.0, hasRamp: false },
        { type: 'STATIONARY_TRAIN', lane: 1, zOffset: 15.0, length: 40.0, hasRamp: false }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 8.0, yOffset: 5.2 },
        { type: 'COIN', lane: 0, zOffset: 12.0, yOffset: 5.2 },
        { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 5.2 },
        { type: 'COIN', lane: 0, zOffset: 20.0, yOffset: 5.2 }
      ]
    }, 0);

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 4.35, -5.0);
    player.previousPosition.copy(player.position);
    player.speed = 22.0;
    const trainObstacle = chunk.obstacles.find(o => o.type === 'TRAIN');
    if (trainObstacle) {
      player.resolveRoofLanding(4.35, trainObstacle.id);
    }
    player.updateCollider();

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);
  });

  await page.waitForTimeout(400);
  const rooftopTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.trainRooftop = {
    ...rooftopTelemetry
  };
  await saveScreenshot(page, '05_running_on_train_roof.png');

  // =========================================================================
  // State 6a: Jump Moment (Apex over Low Barrier)
  // =========================================================================
  console.log('\n--- State 6a: Jump Moment ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'BASELINE_JUMP',
      difficulty: 'EASY',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 8.0, variant: 0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 6.0, yOffset: 1.2 },
        { type: 'COIN', lane: 0, zOffset: 8.0, yOffset: 2.4 },
        { type: 'COIN', lane: 0, zOffset: 10.0, yOffset: 1.2 }
      ]
    }, 0);

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 2.5, 4.0); // Airborne apex
    player.previousPosition.copy(player.position);
    player.isJumping = true;
    player.state = 'JUMP';
    player.updateCollider();

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);
  });

  await page.waitForTimeout(250);
  const jumpTelemetry = await sampleTelemetry(page, 20);
  baselineData.states.jumpMoment = {
    ...jumpTelemetry
  };
  await saveScreenshot(page, '06a_jump_moment.png');

  // =========================================================================
  // State 6b: Slide Moment (Sliding Under High Barrier)
  // =========================================================================
  console.log('\n--- State 6b: Slide Moment ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'BASELINE_SLIDE',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'HIGH_BARRIER', lane: 0, zOffset: 12.0, variant: 0 }
      ],
      collectibles: []
    }, 0);

    const player = game.getPlayer();
    player.currentLane = 0;
    player.targetLane = 0;
    player.position.set(0, 0, 9.5);
    player.previousPosition.copy(player.position);
    player.isSliding = true;
    player.state = 'SLIDE';
    player.slideTimer = 0.45;
    player.updateCollider();

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);
  });

  await page.waitForTimeout(250);
  const slideTelemetry = await sampleTelemetry(page, 20);
  baselineData.states.slideMoment = {
    ...slideTelemetry
  };
  await saveScreenshot(page, '06b_slide_moment.png');

  // =========================================================================
  // State 7: Active Power-Up HUD
  // =========================================================================
  console.log('\n--- State 7: Active Power-Up HUD ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.reset();
    player.position.set(0, 0, 0);
    player.previousPosition.copy(player.position);

    player.powerups.activate('MAGNET');
    player.powerups.activate('SNEAKERS');
    player.hoverboardManager.grantPracticeCharge();
    player.hoverboardManager.activate();

    const sneakersItem = player.powerups.getActivePowerups().find(p => p.type === 'SNEAKERS');
    if (sneakersItem) {
      sneakersItem.remaining = 2.4; // Warning pulse state
    }

    const cam = game.getCameraController();
    cam.setCameraMode('CLASSIC');
    cam.finishIntro(player.position);
  });

  await page.waitForTimeout(300);
  const powerupTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.activePowerupHUD = {
    ...powerupTelemetry
  };
  await saveScreenshot(page, '07_active_powerup_hud.png');

  // =========================================================================
  // State 8: Game Over and Quick Retry
  // =========================================================================
  console.log('\n--- State 8: Game Over and Quick Retry ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      // Force direct game over modal bypass of revive offer for baseline inspection
      game.handleGameOver('CRASH', true);
    }
  });

  await page.waitForSelector('#game-over-retry-btn', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);

  const gameOverTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.gameOverQuickRetry = {
    ...gameOverTelemetry,
    hasPlayAgainButton: await page.evaluate(() => {
      const btn = document.getElementById('game-over-retry-btn');
      return Boolean(btn && btn.offsetParent !== null);
    }),
    retryButtonText: await page.evaluate(() => {
      const el = document.getElementById('game-over-retry-text');
      return el ? el.textContent.trim() : '';
    })
  };
  await saveScreenshot(page, '08_game_over_quick_retry.png');

  // =========================================================================
  // State 9: Character Selection Modal
  // =========================================================================
  console.log('\n--- State 9: Character Selection Modal ---');
  // Click Main Menu from Game Over
  await page.click('#game-over-menu-btn', { force: true });
  await page.waitForSelector('#start-characters-btn', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);

  // Click Characters button from Start Screen
  await page.click('#start-characters-btn', { force: true });
  await page.waitForSelector('#character-select-modal:not(.hidden)', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(800);

  const characterSelectTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.characterSelection = {
    ...characterSelectTelemetry,
    activeCharacterName: await page.evaluate(() => {
      const el = document.getElementById('char-name');
      return el ? el.textContent.trim() : '';
    })
  };
  await saveScreenshot(page, '09_character_selection.png');

  // Close Character Select Modal
  await page.click('#char-close-btn', { force: true });
  await page.waitForTimeout(400);

  // =========================================================================
  // State 10: Shop Modal
  // =========================================================================
  console.log('\n--- State 10: Shop Modal ---');
  await page.click('#start-shop-btn', { force: true });
  await page.waitForSelector('#shop-modal:not(.hidden)', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(800);

  const shopTelemetry = await sampleTelemetry(page, 30);
  baselineData.states.shopModal = {
    ...shopTelemetry,
    shopVisible: await page.evaluate(() => {
      const modal = document.getElementById('shop-modal');
      return Boolean(modal && !modal.classList.contains('hidden'));
    })
  };
  await saveScreenshot(page, '10_shop.png');

  // Close Shop Modal
  await page.click('#shop-close-btn', { force: true });
  await page.waitForTimeout(300);

  // Save Telemetry Summary
  const telemetryJson = JSON.stringify(baselineData, null, 2);
  const localTelemetryPath = path.join(LOCAL_ARTIFACTS_DIR, 'phase0_telemetry.json');
  const brainTelemetryPath = path.join(BRAIN_ARTIFACTS_DIR, 'phase0_telemetry.json');
  fs.writeFileSync(localTelemetryPath, telemetryJson, 'utf8');
  fs.writeFileSync(brainTelemetryPath, telemetryJson, 'utf8');

  console.log('\n✅ ALL 10 REPRESENTATIVE BASELINE STATES CAPTURED SUCCESSFULLY!');
  console.log(`📁 Telemetry JSON saved to: ${localTelemetryPath}`);
  console.log(`🧠 Brain Telemetry JSON saved to: ${brainTelemetryPath}`);

  await browser.close();
}

run().catch((err) => {
  console.error('❌ Baseline capture failed:', err);
  process.exit(1);
});
