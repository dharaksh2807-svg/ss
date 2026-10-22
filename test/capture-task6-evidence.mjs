import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function captureTask6Evidence() {
  console.log('📸 Capturing Task 6 Character Quality, Orientation, Camera Rig & HUD Polish Evidence...\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Lobby View (Front Face & Details)
  console.log('Capturing Evidence 1: Lobby front view (facial expression, front goggles, hoodie, articulated hands)...');
  const shot1 = path.join(ARTIFACT_DIR, 'task6_01_lobby_front_view.png');
  await page.screenshot({ path: shot1 });

  // Start the actual game run
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
  });
  await page.waitForTimeout(500);

  // 2. Normal Running View (Third-Person Arcade Composition)
  console.log('Capturing Evidence 2: Normal running view (third-person framing, back/side silhouette facing forward)...');
  const shot2 = path.join(ARTIFACT_DIR, 'task6_02_normal_running_view.png');
  await page.screenshot({ path: shot2 });

  // 3. Close-up on Runner Back (Confirming Forward Orientation & Zero Uncanny Face)
  console.log('Capturing Evidence 3: Character back close-up (snapback strap, collar, spray-can backpack, cargo joggers, sneakers)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const cam = game.cameraController.camera;
    // Close framing right behind the runner's back
    cam.position.set(0, game.player.position.y + 1.25, game.player.position.z + 2.8);
    cam.lookAt(0, game.player.position.y + 1.1, game.player.position.z - 5.0);
  });
  await page.waitForTimeout(200);
  const shot3 = path.join(ARTIFACT_DIR, 'task6_03_character_back_orientation.png');
  await page.screenshot({ path: shot3 });

  // Reset camera back to standard rig
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.cameraController.reset(game.player.position);
  });

  // 4. Character Jump Action Framing
  console.log('Capturing Evidence 4: Jump action framing (airborne apex, horizon stability)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.jump();
    // Advance into jump apex
    for (let i = 0; i < 15; i++) {
      game.player.update(0.02);
      game.cameraController.update(
        game.player.position,
        0.02,
        1.0 + i * 0.02,
        game.player.speed,
        game.player.groundY,
        game.player.isSliding
      );
    }
  });
  await page.waitForTimeout(200);
  const shot4 = path.join(ARTIFACT_DIR, 'task6_04_jump_framing.png');
  await page.screenshot({ path: shot4 });

  // 5. Character Slide Action Framing (Subtle Camera Dip)
  console.log('Capturing Evidence 5: Slide action framing (low obstacle clearance, camera dip)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.slide();
    for (let i = 0; i < 12; i++) {
      game.player.update(0.02);
      game.cameraController.update(
        game.player.position,
        0.02,
        2.0 + i * 0.02,
        game.player.speed,
        game.player.groundY,
        game.player.isSliding
      );
    }
  });
  await page.waitForTimeout(200);
  const shot5 = path.join(ARTIFACT_DIR, 'task6_05_slide_framing.png');
  await page.screenshot({ path: shot5 });

  // 6. Train-Rooftop Running View
  console.log('Capturing Evidence 6: Train-rooftop running (elevation tracking, horizon clearance)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.position.y = 4.35;
    game.player.groundY = 4.35;
    game.player.supportSurface = 'TRAIN_ROOF';
    for (let i = 0; i < 30; i++) {
      game.player.update(0.02);
      game.cameraController.update(
        game.player.position,
        0.02,
        3.0 + i * 0.02,
        game.player.speed,
        game.player.groundY,
        game.player.isSliding
      );
    }
  });
  await page.waitForTimeout(200);
  const shot6 = path.join(ARTIFACT_DIR, 'task6_06_train_roof_run.png');
  await page.screenshot({ path: shot6 });

  // 7. Hoverboard Activation
  console.log('Capturing Evidence 7: Hoverboard surfing stance...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.position.y = 0.9;
    game.player.groundY = 0.9;
    game.player.supportSurface = 'GROUND';
    game.player.hoverboardManager.activate('board_cyber_cruiser');
    for (let i = 0; i < 15; i++) {
      game.player.update(0.02);
      game.cameraController.update(
        game.player.position,
        0.02,
        4.0 + i * 0.02,
        game.player.speed,
        game.player.groundY,
        game.player.isSliding
      );
    }
  });
  await page.waitForTimeout(200);
  const shot7 = path.join(ARTIFACT_DIR, 'task6_07_hoverboard_activation.png');
  await page.screenshot({ path: shot7 });

  // 8. Jetpack High-Altitude Flight
  console.log('Capturing Evidence 8: Jetpack flight camera vista...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.activate('JETPACK');
    game.player.update(0.05);
    // Converge into cruise altitude
    for (let i = 0; i < 40; i++) {
      game.player.update(0.03);
      game.cameraController.update(
        game.player.position,
        0.03,
        5.0 + i * 0.03,
        game.player.speed,
        game.player.groundY,
        game.player.isSliding
      );
    }
  });
  await page.waitForTimeout(200);
  const shot8 = path.join(ARTIFACT_DIR, 'task6_08_jetpack_flight_camera.png');
  await page.screenshot({ path: shot8 });

  // 9. Character Variety Showcase: Luna & Cruz
  console.log('Capturing Evidence 9: Character roster variety (Luna & Cruz)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.hoverboardManager.reset();
    game.player.position.set(0, 0.9, 0);
    game.player.groundY = 0.9;
    game.player.applyCharacter('char_luna', 'luna_neon');
    game.cameraController.reset(game.player.position);
    for (let i = 0; i < 10; i++) {
      game.player.update(0.02);
      game.cameraController.update(game.player.position, 0.02, 6.0, 18.0, 0.9, false);
    }
  });
  await page.waitForTimeout(200);
  const shot9 = path.join(ARTIFACT_DIR, 'task6_09_luna_running.png');
  await page.screenshot({ path: shot9 });

  // 10. Mobile Portrait Viewport
  console.log('Capturing Evidence 10: Mobile portrait mode (390x844 responsive framing & safe-area HUD)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.cameraController.onResize();
    for (let i = 0; i < 20; i++) {
      game.player.update(0.02);
      game.cameraController.update(game.player.position, 0.02, 7.0, 18.0, 0.9, false);
    }
  });
  await page.waitForTimeout(300);
  const shot10 = path.join(ARTIFACT_DIR, 'task6_10_mobile_portrait_gameplay.png');
  await page.screenshot({ path: shot10 });

  // 11. HUD Mission Completion Celebration & Retirement
  console.log('Capturing Evidence 11: HUD mission completion toast & clean overlay state...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.cameraController.onResize();
    // Complete active mission
    const activeMissions = game.progression.getActiveMissions();
    if (activeMissions[0]) {
      activeMissions[0].completed = true;
      activeMissions[0].progress = activeMissions[0].target;
      window.__METRO_BUS__.emit('MISSION_COMPLETED', activeMissions[0]);
    }
    game.hud.update(0.016);
  });
  await page.waitForTimeout(300);
  const shot11 = path.join(ARTIFACT_DIR, 'task6_11_hud_mission_celebration.png');
  await page.screenshot({ path: shot11 });

  // Fast forward celebration and confirm retirement
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const activeMissions = game.progression.getActiveMissions();
    activeMissions.forEach(m => { m.completed = true; m.progress = m.target; });
    game.hud.update(3.0);
  });
  await page.waitForTimeout(200);
  const shot12 = path.join(ARTIFACT_DIR, 'task6_12_hud_mission_retired.png');
  await page.screenshot({ path: shot12 });

  await browser.close();
  console.log('\n🎉 ALL 12 TASK 6 VISUAL EVIDENCE SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureTask6Evidence().catch((err) => {
  console.error('Error capturing evidence:', err);
  process.exit(1);
});
