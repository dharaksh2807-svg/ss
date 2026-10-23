import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/57153f5e-91de-46af-85e9-d6fd6861c935';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function captureAcceptanceScreenshots() {
  console.log('🧪 Starting Task 5 Visual Acceptance Capture Suite...\n');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
  } catch (err) {
    console.log('Falling back to bundled chromium...');
    browser = await chromium.launch({ headless: true });
  }

  // Landscape context (1440x900)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('🌐 Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // ----------------------------------------------------
  // 1. Character Lobby Preview (Hero 3/4 pose)
  // ----------------------------------------------------
  console.log('📸 1. Capturing: task5_06_character_lobby_preview.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_06_character_lobby_preview.png') });

  // ----------------------------------------------------
  // 2. Character Face Close-Up (Showroom Front 3/4 in Character Modal)
  // ----------------------------------------------------
  console.log('📸 2. Opening Character Select Modal for Face Close-Up...');
  await page.click('#start-characters-btn', { force: true });
  await page.waitForTimeout(1200);

  console.log('📸 Capturing: task5_07_character_face_closeup.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_07_character_face_closeup.png') });

  // Close character modal
  await page.click('#char-close-btn', { force: true });
  await page.waitForTimeout(600);

  // ----------------------------------------------------
  // 3. Normal Gameplay View (Locked behind runner facing down -Z)
  // ----------------------------------------------------
  console.log('📸 3. Launching Normal Gameplay...');
  await page.click('#start-play-btn', { force: true });
  // Skip intro sequence quickly
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1600);

  console.log('📸 Capturing: task5_05_normal_gameplay_view.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_05_normal_gameplay_view.png') });

  // ----------------------------------------------------
  // 4. Running Animation (Mid-run Athletic Stride)
  // ----------------------------------------------------
  console.log('📸 4. Running Animation Mid-stride...');
  await page.waitForTimeout(800);
  console.log('📸 Capturing: task5_08_running_animation.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_08_running_animation.png') });

  // ----------------------------------------------------
  // 5. Jumping Animation
  // ----------------------------------------------------
  console.log('📸 5. Triggering Jump for Jumping Pose...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(220); // Capture near apex

  console.log('📸 Capturing: task5_09_jumping_animation.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_09_jumping_animation.png') });

  // ----------------------------------------------------
  // 6. Game Over Pose (Front/Side 3/4 Camera Angle)
  // ----------------------------------------------------
  console.log('📸 6. Triggering Crash for Game Over Pose...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      if (typeof game.handleGameOver === 'function') {
        game.handleGameOver('CRASH');
      } else if (typeof game.handleFatalCrash === 'function') {
        game.handleFatalCrash('CRASH');
      }
    }
  });
  await page.waitForTimeout(1200);

  console.log('📸 Capturing: task5_10_game_over_pose.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_10_game_over_pose.png') });

  // ----------------------------------------------------
  // 7. Detailed Train Geometry: Modern Train Front, Side, Climbable Ramp, Moving Train & Tunnel
  // ----------------------------------------------------
  console.log('📸 7. Starting Practice Mode to Showcase Trains & Tunnels...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.startPractice('TRAIN_SURFING', false);
    }
  });
  await page.waitForTimeout(1000);

  // Front of Modern Train
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.worldScene) {
      let targetTrain = null;
      game.worldScene.scene.traverse((obj) => {
        if (!targetTrain && obj.userData && obj.userData.isTrain && !obj.userData.isMoving) {
          targetTrain = obj;
        }
      });
      if (targetTrain) {
        const p = game.player.position.clone();
        targetTrain.getWorldPosition(p);
        game.cameraController.camera.position.set(p.x + 3.2, 2.4, p.z + 14);
        game.cameraController.camera.lookAt(p.x, 2.0, p.z + 8);
        game.cameraController.camera.updateProjectionMatrix();
      }
    }
  });
  await page.waitForTimeout(500);
  console.log('📸 Capturing: task5_01_front_modern_metro.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_01_front_modern_metro.png') });

  // Train Side (Windows, Recessed Frames, Sliding Doors & Fluting)
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.worldScene) {
      let targetTrain = null;
      game.worldScene.scene.traverse((obj) => {
        if (!targetTrain && obj.userData && obj.userData.isTrain && !obj.userData.isMoving) {
          targetTrain = obj;
        }
      });
      if (targetTrain) {
        const p = game.player.position.clone();
        targetTrain.getWorldPosition(p);
        game.cameraController.camera.position.set(p.x + 4.6, 2.2, p.z);
        game.cameraController.camera.lookAt(p.x + 1.4, 2.2, p.z);
        game.cameraController.camera.updateProjectionMatrix();
      }
    }
  });
  await page.waitForTimeout(500);
  console.log('📸 Capturing: task5_02_train_side_doors_windows.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_02_train_side_doors_windows.png') });

  // Climbable Train Ramp
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.startPractice('RAMP_CLIMBING', false);
    }
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.worldScene) {
      let rampTrain = null;
      game.worldScene.scene.traverse((obj) => {
        if (!rampTrain && obj.userData && obj.userData.type === 'TRAIN_RAMP') {
          rampTrain = obj;
        }
      });
      if (rampTrain) {
        const p = game.player.position.clone();
        rampTrain.getWorldPosition(p);
        game.cameraController.camera.position.set(p.x + 3.4, 2.6, p.z + 18);
        game.cameraController.camera.lookAt(p.x, 2.2, p.z + 10);
        game.cameraController.camera.updateProjectionMatrix();
      }
    }
  });
  await page.waitForTimeout(500);
  console.log('📸 Capturing: task5_03_climbable_ramp_train.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_03_climbable_ramp_train.png') });

  // Moving Train with Flashing Telegraphed Headlights
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.startPractice('MOVING_TRAIN_DODGE', false);
    }
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.worldScene) {
      let movingTrain = null;
      game.worldScene.scene.traverse((obj) => {
        if (!movingTrain && obj.userData && obj.userData.isMoving) {
          movingTrain = obj;
        }
      });
      if (movingTrain) {
        const p = game.player.position.clone();
        movingTrain.getWorldPosition(p);
        game.cameraController.camera.position.set(p.x + 2.8, 2.2, p.z + 16);
        game.cameraController.camera.lookAt(p.x, 2.0, p.z + 6);
        game.cameraController.camera.updateProjectionMatrix();
      }
    }
  });
  await page.waitForTimeout(500);
  console.log('📸 Capturing: task5_04_moving_train_oncoming.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_04_moving_train_oncoming.png') });

  // Tunnel Gameplay View
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.startPractice('TUNNEL_NAVIGATION', false);
    }
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.cameraController) {
      game.cameraController.camera.position.set(0, 2.8, game.player.position.z + 4.8);
      game.cameraController.camera.lookAt(0, 1.8, game.player.position.z - 18);
      game.cameraController.camera.updateProjectionMatrix();
    }
  });
  await page.waitForTimeout(500);
  console.log('📸 Capturing: task5_12_tunnel_gameplay.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_12_tunnel_gameplay.png') });

  await context.close();

  // ----------------------------------------------------
  // 8. Mobile Gameplay (Portrait 390x844)
  // ----------------------------------------------------
  console.log('\n📸 8. Capturing Mobile Portrait Gameplay (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Start mobile run
  await mobilePage.click('#start-play-btn', { force: true });
  await mobilePage.waitForTimeout(500);
  await mobilePage.keyboard.press('Space'); // Skip intro
  await mobilePage.waitForTimeout(1500);

  console.log('📸 Capturing: task5_11_mobile_gameplay.png');
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_11_mobile_gameplay.png') });

  await mobileContext.close();
  await browser.close();

  console.log('\n🎉 ALL 12 VISUAL ACCEPTANCE SCREENSHOTS SUCCESSFULLY CAPTURED!\n');
}

captureAcceptanceScreenshots().catch((err) => {
  console.error('❌ Screenshot capture error:', err);
  process.exit(1);
});
