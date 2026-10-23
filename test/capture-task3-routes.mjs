import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureTask3Routes() {
  console.log('🪙 Starting Task 3 Intelligent Coin Routes & Archetypes Visual Capture...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('1. Navigating to game at http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-canvas');
  await page.waitForTimeout(1000);

  // Start the run
  console.log('2. Starting game run & applying screenshot stabilization...');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(600);

  // Freeze game physics and disable game-over/crash modals during camera capture
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.handleGameOver = () => {};
    game.player.isInvincible = true;
    game.player.speed = 0;
    game.currentSpeed = 0;
    game.cameraController.setLobbyMode(false);
    game.gameOverModal.hide();
    game.pauseModal.hide();
  });

  // Helper inside page to frame camera accurately
  const setCameraView = async (playerPos, camPos, lookAtPos) => {
    await page.evaluate(({ pPos, cPos, lPos }) => {
      const game = window.__METRO_GAME__;
      game.gameOverModal.hide();
      game.player.position.set(pPos.x, pPos.y, pPos.z);
      game.player.currentLane = pPos.lane || 0;
      game.player.targetLane = pPos.lane || 0;
      
      const cam = game.cameraController.camera;
      cam.position.set(cPos.x, cPos.y, cPos.z);
      cam.lookAt(lPos.x, lPos.y, lPos.z);
      cam.updateMatrixWorld();
    }, { pPos: playerPos, cPos: camPos, lPos: lookAtPos });
    await page.waitForTimeout(300);
  };

  // -------------------------------------------------------------
  // SHOT 1: Jump Arc over Low Hurdle (Parabolic Ballistic Trajectory)
  // -------------------------------------------------------------
  console.log('3. Capturing Shot 1: Parabolic Jump Arc over Low Hurdle...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(0, 18.0, 0); // INTRO_HURDLES (jump arc at z=16 to 28)
    chunk.populate(pattern, 0);
  });
  await setCameraView(
    { x: 0, y: 0, z: -11.0, lane: 0 },
    { x: 0, y: 2.6, z: -5.5 },
    { x: 0, y: 1.6, z: -25.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_1_jump_arc.png'),
    fullPage: false
  });

  // -------------------------------------------------------------
  // SHOT 2: Low-Profile Slide Guidance (Waist Height 0.60m Under High Barrier)
  // -------------------------------------------------------------
  console.log('4. Capturing Shot 2: Slide Guidance under Overhead Barrier...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(4, 20.0, 150); // SLIDE_TRAINING (slide guidance at z=16 to 26 in lane 1)
    chunk.populate(pattern, 0);
    game.player.isSliding = true;
  });
  await setCameraView(
    { x: 2.5, y: 0, z: -11.0, lane: 1 },
    { x: 2.5, y: 2.3, z: -5.5 },
    { x: 2.5, y: 0.9, z: -25.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_2_slide_guidance.png'),
    fullPage: false
  });

  // -------------------------------------------------------------
  // SHOT 3: Smooth S-Curve Lane-Switch Trail (Curving Between Lanes)
  // -------------------------------------------------------------
  console.log('5. Capturing Shot 3: S-Curve Lane-Switch Trail...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(2, 18.0, 50); // LANE_SWITCH_TUTORIAL (lane switch 0 -> -1 at z=15 to 27)
    chunk.populate(pattern, 0);
    game.player.isSliding = false;
  });
  await setCameraView(
    { x: 0, y: 0, z: -9.0, lane: 0 },
    { x: 0, y: 2.8, z: -3.5 },
    { x: -1.0, y: 1.2, z: -24.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_3_lane_switch.png'),
    fullPage: false
  });

  // -------------------------------------------------------------
  // SHOT 4: Train Rooftop Ramp Ascent & Walkable Roof Spine
  // -------------------------------------------------------------
  console.log('6. Capturing Shot 4: Train Rooftop Ramp Ascent & Roof Spine...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(9, 24.0, 300); // TRAIN_ROOF_RAMP_RUN
    chunk.populate(pattern, 0);
  });
  await setCameraView(
    { x: 0, y: 0, z: -4.0, lane: 0 },
    { x: 0, y: 3.8, z: 2.5 },
    { x: 0, y: 3.2, z: -24.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_4_train_rooftop_route.png'),
    fullPage: false
  });

  // -------------------------------------------------------------
  // SHOT 5: Risk/Reward Branching Route (Safe Lane vs Technical Gauntlet)
  // -------------------------------------------------------------
  console.log('7. Capturing Shot 5: Risk/Reward Branching Route...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(26, 35.0, 1800); // PRECISION_COIN_RISK_ROUTE
    chunk.populate(pattern, 0);
  });
  await setCameraView(
    { x: -1.25, y: 0, z: -7.0, lane: 0 },
    { x: -1.25, y: 3.2, z: -1.5 },
    { x: -0.5, y: 1.3, z: -24.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_5_risk_reward_branch.png'),
    fullPage: false
  });

  // -------------------------------------------------------------
  // SHOT 6: Post-Obstacle Reward Burst (Rewarding Hurdle Jump Clearance)
  // -------------------------------------------------------------
  console.log('8. Capturing Shot 6: Post-Obstacle Reward Burst...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    const pattern = game.trackManager.selectPattern(0, 18.0, 0); // INTRO_HURDLES (post obstacle at z=29 to 35)
    chunk.populate(pattern, 0);
  });
  await setCameraView(
    { x: 0, y: 0, z: -23.0, lane: 0 },
    { x: 0, y: 2.2, z: -17.5 },
    { x: 0, y: 1.1, z: -35.0 }
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'task3_6_post_obstacle_reward.png'),
    fullPage: false
  });

  await browser.close();
  console.log('🎉 All 6 Task 3 Visual Evidence Screenshots Captured Successfully!');
}

captureTask3Routes().catch((err) => {
  console.error('❌ Capture error:', err);
  process.exit(1);
});
