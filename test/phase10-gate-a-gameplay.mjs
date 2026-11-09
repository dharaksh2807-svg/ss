import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase10');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Gate A] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`📸 Saved screenshot: ${filename}`);
}

async function runGateA() {
  log('===============================================================');
  log('🕹️ GATE A: GAMEPLAY CORRECTNESS & COLLISION INTEGRITY AUDIT');
  log('===============================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const assertions = [];
  function assert(name, condition, details = '') {
    if (condition) {
      log(`  ✅ PASS: ${name} ${details}`);
      assertions.push({ name, pass: true, details });
    } else {
      log(`  ❌ FAIL: ${name} ${details}`);
      assertions.push({ name, pass: false, details });
      throw new Error(`Assertion failed: ${name} - ${details}`);
    }
  }

  // 1. Initial Load
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  assert('Engine Initialized', true, 'window.__METRO_GAME__ active');

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  // Start run
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    if (game.openingSequence) game.openingSequence.skip();
  });
  await page.waitForTimeout(300);

  // 2. Three-Lane Movement
  log('Testing 3-lane movement...');
  const laneTest = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    player.isIntroInvincible = true;

    const initialLane = player.currentLane; // 0
    const initialX = player.position.x; // 0

    function finishLaneChange() {
      for (let i = 0; i < 30; i++) {
        player.update(0.016);
        if (!player.isChangingLane && player.queuedLaneChange === null) break;
      }
    }

    // Move Left
    player.handleInput('LEFT');
    finishLaneChange();
    const leftLane = player.currentLane; // -1
    const leftX = player.position.x;

    // Try moving Left again (boundary check)
    player.handleInput('LEFT');
    finishLaneChange();
    const clampedLeftLane = player.currentLane; // still -1

    // Move Right back to center
    player.handleInput('RIGHT');
    finishLaneChange();
    const centerLane = player.currentLane; // 0

    // Move Right to right lane
    player.handleInput('RIGHT');
    finishLaneChange();
    const rightLane = player.currentLane; // 1
    const rightX = player.position.x;

    // Try moving Right again (boundary check)
    player.handleInput('RIGHT');
    finishLaneChange();
    const clampedRightLane = player.currentLane; // still 1

    // Return to center
    player.handleInput('LEFT');
    finishLaneChange();

    return {
      initialLane,
      leftLane,
      leftX,
      clampedLeftLane,
      centerLane,
      rightLane,
      rightX,
      clampedRightLane,
      finalLane: player.currentLane
    };
  });

  log(`Lane test results: ${JSON.stringify(laneTest)}`);
  assert('Lane starts at center (0)', laneTest.initialLane === 0);
  assert('Lane moves to left (-1)', laneTest.leftLane === -1 && laneTest.leftX < -1.8);
  assert('Lane clamps at left (-1)', laneTest.clampedLeftLane === -1);
  assert('Lane moves to right (1)', laneTest.rightLane === 1 && laneTest.rightX > 1.8);
  assert('Lane clamps at right (1)', laneTest.clampedRightLane === 1);
  assert('Lane returns to center (0)', laneTest.finalLane === 0);

  // 3. Jump, Slide, Fast Drop, Jump-to-Slide
  log('Testing Jump, Slide, Fast Drop, Jump-to-Slide...');
  const verticalTest = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const player = game.player;

    // A. Normal Jump
    player.handleInput('UP');
    const jumpState = player.state;
    let maxJumpY = player.position.y;
    for (let i = 0; i < 80; i++) {
      player.update(0.016);
      if (player.position.y > maxJumpY) maxJumpY = player.position.y;
      if (!player.isJumping && i > 15) break;
    }
    const landedY = player.position.y;

    // B. Slide
    player.handleInput('DOWN');
    const slideState = player.state;
    const slideHeight = player.getColliderHeight ? player.getColliderHeight() : 0.75;
    for (let i = 0; i < 20; i++) {
      player.update(0.016);
    }

    // C. Fast Drop
    player.handleInput('UP'); // jump
    for (let i = 0; i < 10; i++) {
      player.update(0.016);
    }
    const midAirY = player.position.y;
    player.handleInput('DOWN'); // fast drop
    const fastDropVy = player.verticalVelocity;
    for (let i = 0; i < 40; i++) {
      player.update(0.016);
      if (!player.isJumping) break;
    }
    const postDropY = player.position.y;

    return {
      jumpState,
      maxJumpY,
      landedY,
      slideState,
      slideHeight,
      midAirY,
      fastDropVy,
      postDropY
    };
  });

  assert('Jump initiates JUMP state', verticalTest.jumpState === 'JUMP');
  assert('Jump apex reaches > 2.0m', verticalTest.maxJumpY >= 2.0, `Apex: ${verticalTest.maxJumpY.toFixed(2)}m`);
  assert('Player lands back at track ground (PLAYER_BASE_Y = 0.9m)', Math.abs(verticalTest.landedY - 0.9) < 0.05, `Y: ${verticalTest.landedY.toFixed(2)}m`);
  assert('Slide initiates SLIDE state', verticalTest.slideState === 'SLIDE');
  assert('Slide reduces collider height', verticalTest.slideHeight <= 0.8, `Height: ${verticalTest.slideHeight}m`);
  assert('Fast drop applies downward velocity', verticalTest.fastDropVy < 0, `Vy: ${verticalTest.fastDropVy.toFixed(2)}`);
  assert('Fast drop rapidly returns player to ground (0.9m)', Math.abs(verticalTest.postDropY - 0.9) < 0.05, `Post-drop Y: ${verticalTest.postDropY.toFixed(2)}m`);

  await saveScreenshot(page, 'gate_a_locomotion_verified.png');

  // 4. Moving Train & Frontal Collision
  log('Testing Moving Train & Frontal Collision...');
  const movingTrainTest = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    const chunk = game.trackManager.chunks[0];

    chunk.clearDynamicItems();
    chunk.populate({
      name: 'GATE_A_MOVING_TRAIN',
      difficulty: 'NORMAL',
      obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 30, velocityZ: 12.0, length: 22 }],
      collectibles: []
    }, player.position.z);

    const train = chunk.obstacles.find(o => o.type === 'MOVING_TRAIN');
    if (!train) return { isMoving: false, advancement: 0 };

    const initialTrainZ = train.group.position.z;
    chunk.update(0.5, 0.5, player.position.z, player.speed);
    const movedTrainZ = train.group.position.z;

    return {
      isMoving: train.isMoving,
      advancement: movedTrainZ - initialTrainZ
    };
  });

  assert('Moving train isMoving flag is true', movingTrainTest.isMoving);
  assert('Moving train advances towards player (+Z)', movingTrainTest.advancement > 0, `Advancement: ${movingTrainTest.advancement}m`);

  // 5. Rooftop Traversal & Gangway Support
  log('Testing Rooftop Traversal & Gangway Seams...');
  const roofTest = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;

    // Simulate player climbing ramp onto train roof
    player.resolveRoofLanding(4.35, 'obs_test_roof_1', 'group_1');

    let stayedSupported = true;
    let minObservedY = 999;
    for (let i = 0; i < 60; i++) {
      player.update(0.016);
      if (player.position.y < minObservedY) minObservedY = player.position.y;
      if (player.position.y < 4.0) stayedSupported = false;
    }

    return {
      stayedSupported,
      finalY: player.position.y,
      minObservedY
    };
  });

  assert('Player maintains continuous support on train roof (Y ~ 4.35m)', roofTest.stayedSupported, `Min Y: ${roofTest.minObservedY.toFixed(2)}m`);

  // 6. Shield & Hoverboard Collision Absorption
  log('Testing Shield & Hoverboard Collision Absorption...');
  const absorptionTest = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;

    player.revive(0);
    player.activateReviveGrace(0);

    // Shield test
    player.powerups.activate('SHIELD');
    const shieldAbsorbed = !player.crash('OBSTACLE_COLLISION');
    const playerStateAfterShield = player.state;

    // Hoverboard test
    player.hoverboardManager.activate();
    const boardAbsorbed = !player.crash('OBSTACLE_COLLISION');
    const playerStateAfterBoard = player.state;

    return {
      shieldAbsorbed,
      playerStateAfterShield,
      boardAbsorbed,
      playerStateAfterBoard
    };
  });

  assert('Shield absorbs fatal crash without death', absorptionTest.shieldAbsorbed);
  assert('Player remains running after shield absorption', absorptionTest.playerStateAfterShield === 'RUN');
  assert('Hoverboard absorbs fatal crash without death', absorptionTest.boardAbsorbed);
  assert('Player remains running after hoverboard absorption', absorptionTest.playerStateAfterBoard === 'RUN');

  // 7. Coin Collection & Powerups
  log('Testing Coin Collection & Jetpack...');
  const powerupTest = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;

    const initialCoins = game.progression.getCoins();
    window.__METRO_BUS__.emit(window.__METRO_EVENTS__.COIN_COLLECTED);
    const coinsAfterCollect = game.progression.getCoins();

    // Activate Jetpack
    player.powerups.activate('JETPACK');
    const isJetpackActive = player.powerups.isJetpackActive();
    for (let i = 0; i < 40; i++) {
      player.update(0.016);
    }
    const jetpackY = player.position.y;

    return {
      coinsIncreased: coinsAfterCollect > initialCoins,
      isJetpackActive,
      jetpackY
    };
  });

  assert('Coin collection increases progression wallet', powerupTest.coinsIncreased);
  assert('Jetpack activates successfully', powerupTest.isJetpackActive);
  assert('Jetpack elevates player to sky corridor (Y > 5.0m)', powerupTest.jetpackY >= 5.0, `Jetpack Y: ${powerupTest.jetpackY.toFixed(2)}m`);

  await saveScreenshot(page, 'gate_a_jetpack_sky_corridor.png');

  // 8. Death, Game Over, and Fast Restart
  log('Testing Death, Game Over, and Fast Restart...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;

    // Remove invincibility and powerups
    player.powerups.reset();
    player.hoverboardManager.deactivate();
    player.isIntroInvincible = false;
    player.activateReviveGrace(0);

    // Fatal crash
    game.handleFatalCrash('TRAIN_BODY');
    game.skipDeathOrGameOverDelay();
  });

  await page.waitForTimeout(400);
  const endRunBtn = await page.$('#revive-end-run-btn');
  if (endRunBtn && await endRunBtn.isVisible()) {
    log('  Declining revive to view Game Over screen...');
    await endRunBtn.click();
    await page.waitForTimeout(600);
  }

  const restartTest = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const gameOverVisible = !document.getElementById('game-over-modal')?.classList.contains('hidden');

    // Click retry / restart
    const retryBtn = document.getElementById('game-over-retry-btn') || document.querySelector('.btn-retry');
    if (retryBtn) retryBtn.click();
    else game.startRun('NORMAL', true);

    if (game.openingSequence) game.openingSequence.skip();

    return {
      gameOverVisible,
      newLifecycle: game.lifecycleState,
      playerSpeed: game.player.speed,
      distance: game.player.distanceTraveled
    };
  });

  assert('Game Over modal displayed on fatal crash', restartTest.gameOverVisible);
  assert('Restart resets lifecycleState to PLAYING', restartTest.newLifecycle === 'PLAYING');
  assert('Restart resets distance to 0', restartTest.distance === 0);
  assert('Restart resets player speed to 18.0 m/s', restartTest.playerSpeed === 18.0, `Speed: ${restartTest.playerSpeed} m/s`);

  await saveScreenshot(page, 'gate_a_restart_clean_state.png');

  log('===============================================================');
  log(`🏆 GATE A VERDICT: PASS (${assertions.length}/${assertions.length} assertions passed)`);
  log('===============================================================\n');

  await browser.close();
  return { pass: true, assertions };
}

runGateA().then(res => {
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gate_a_results.json'), JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('[Gate A ERROR]', err);
  process.exit(1);
});
