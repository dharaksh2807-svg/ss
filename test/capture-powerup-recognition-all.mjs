import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function captureAllPowerupEvidence() {
  console.log('📸 Starting Power-Up Visual & UX Quality Gate Capture...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Start the run cleanly
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('hud')?.classList.remove('hidden');
    game.startRun('NORMAL', false);
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
    // Freeze camera update so we can position it dynamically
    game.cameraController.update = () => {};
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // SHOT 1: Approaching Magnet in 3D railway
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Approaching Magnet...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    if (game.chaser?.mesh) game.chaser.mesh.visible = false;
    // Spawn 3D Magnet pickup ahead on middle track
    const magnetMesh = game.trackManager.collectibleFactory.createMagnetPickup();
    magnetMesh.position.set(0, 1.2, player.position.z - 7);
    game.worldScene.scene.add(magnetMesh);

    const cam = game.cameraController.camera;
    cam.position.set(1.5, player.position.y + 1.8, player.position.z + 1.5);
    cam.lookAt(0, 1.2, player.position.z - 7);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pickup_magnet_approaching.png') });

  // -------------------------------------------------------------
  // SHOT 2: Approaching Jetpack in 3D railway
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Approaching Jetpack...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    const jetpackMesh = game.trackManager.collectibleFactory.createJetpackPickup();
    jetpackMesh.position.set(-2.0, 1.3, player.position.z - 7);
    game.worldScene.scene.add(jetpackMesh);

    const cam = game.cameraController.camera;
    cam.position.set(0, player.position.y + 1.8, player.position.z + 1.5);
    cam.lookAt(-2.0, 1.3, player.position.z - 7);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pickup_jetpack_approaching.png') });

  // -------------------------------------------------------------
  // SHOT 3: Approaching Sneakers in 3D railway
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Approaching Sneakers...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    const sneakersMesh = game.trackManager.collectibleFactory.createSneakersPickup();
    sneakersMesh.position.set(2.0, 1.2, player.position.z - 7);
    game.worldScene.scene.add(sneakersMesh);

    const cam = game.cameraController.camera;
    cam.position.set(0.5, player.position.y + 1.8, player.position.z + 1.5);
    cam.lookAt(2.0, 1.2, player.position.z - 7);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pickup_sneakers_approaching.png') });

  // -------------------------------------------------------------
  // SHOT 4: Approaching Shield & Multiplier in 3D railway
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: Approaching Shield & Multiplier...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    const shieldMesh = game.trackManager.collectibleFactory.createShieldPickup();
    shieldMesh.position.set(-2.0, 1.2, player.position.z - 7);
    game.worldScene.scene.add(shieldMesh);

    const multMesh = game.trackManager.collectibleFactory.createMultiplierPickup();
    multMesh.position.set(2.0, 1.2, player.position.z - 7);
    game.worldScene.scene.add(multMesh);

    const cam = game.cameraController.camera;
    cam.position.set(0, player.position.y + 1.8, player.position.z + 1.5);
    cam.lookAt(0, 1.2, player.position.z - 7);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pickup_shield_multiplier_approaching.png') });

  // -------------------------------------------------------------
  // SHOT 5: Instant Pickup Toast Notification + Single Centered Timer
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: Instant Pickup Toast + Centered Timer...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.powerups.activate('JETPACK');
    game.hud.update();
    game.hud.showPickupToast('JETPACK');
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_single_timer_with_toast.png') });

  // -------------------------------------------------------------
  // SHOT 6: Two Active Power-Ups (Side-by-Side Centered Cluster)
  // -------------------------------------------------------------
  console.log('Capturing Shot 6: Two Active Timers Side-by-Side...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.activate('MAGNET');
    game.hud.update();
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_two_timers_centered.png') });

  // -------------------------------------------------------------
  // SHOT 7: Multiple Active Power-Ups (3+ Horizontal Compact Group)
  // -------------------------------------------------------------
  console.log('Capturing Shot 7: Three Active Timers (Compact Row)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.activate('MULTIPLIER');
    game.player.powerups.activate('SHIELD');
    game.hud.update();
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_multi_timers_compact.png') });

  // -------------------------------------------------------------
  // SHOT 8: Near-Expiration Warning (<= 3s) & Critical Countdown (< 1s)
  // -------------------------------------------------------------
  console.log('Capturing Shot 8: Near-Expiration Warning & Final Countdown...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.powerups.activate('MAGNET');
    game.player.powerups.activate('SNEAKERS');
    const magnet = game.player.powerups.getActivePowerups().find(p => p.type === 'MAGNET');
    if (magnet) magnet.remaining = 2.4;
    const sneakers = game.player.powerups.getActivePowerups().find(p => p.type === 'SNEAKERS');
    if (sneakers) sneakers.remaining = 0.8;
    game.hud.update();
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_expiration_warning_critical.png') });

  // -------------------------------------------------------------
  // SHOT 9: Hoverboard + Active Power-up Synchronization
  // -------------------------------------------------------------
  console.log('Capturing Shot 9: Hoverboard + Power-up Synchronization...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.hoverboardManager.activate();
    game.player.powerups.activate('JETPACK');
    game.hud.update();
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_hoverboard_and_powerup.png') });

  // -------------------------------------------------------------
  // SHOT 10: Mobile Viewport (390 x 844) Responsiveness
  // -------------------------------------------------------------
  console.log('Capturing Shot 10: Mobile Viewport Responsiveness...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.hud.update();
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hud_mobile_upper_center_timers.png') });

  // -------------------------------------------------------------
  // SHOT 11: Tunnel Atmosphere with High-Contrast Pickups
  // -------------------------------------------------------------
  console.log('Capturing Shot 11: Tunnel Atmosphere with High-Contrast Pickups...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.player;
    game.hud.setMode('HARD');
    // Place a shield and a magnet in front
    const shieldMesh = game.trackManager.collectibleFactory.createShieldPickup();
    shieldMesh.position.set(0, 1.2, player.position.z - 10);
    game.worldScene.scene.add(shieldMesh);

    const cam = game.cameraController.camera;
    cam.position.set(0, player.position.y + 2.0, player.position.z + 5.0);
    cam.lookAt(0, 1.2, player.position.z - 10);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_tunnel_hard_mode_pickups.png') });

  await browser.close();
  console.log('✅ All Power-up visual and UX screenshots successfully captured!');
}

captureAllPowerupEvidence().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
