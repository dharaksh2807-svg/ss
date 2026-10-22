import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureTask3Coins() {
  console.log('🪙 Starting Task 3 Coin Visual & Interaction Evidence Capture...');

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

  // Start the run first so we have the active gameplay camera and lighting
  console.log('2. Starting game run...');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(600);

  // Activate hoverboard so runner cannot crash into any obstacle during screenshot recording
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.activate('HOVERBOARD');
  });

  // -------------------------------------------------------------
  // SHOT 1: Coin Close-Up Studio Inspection
  // Position a coin right in front of the camera in active gameplay lighting
  // -------------------------------------------------------------
  console.log('3. Capturing high-detail close-up of 3D Arcade Coin...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const camera = game.cameraController.camera;

    const factory = game.trackManager.collectibleFactory;
    const coin = factory.createCoin();
    coin.name = 'INSPECTION_COIN';

    // Position 1.8m directly in front of gameplay camera, slightly angled to reveal bevel & depth
    coin.position.copy(camera.position);
    coin.quaternion.copy(camera.quaternion);
    coin.translateZ(-1.8);
    coin.translateY(-0.1);
    coin.rotateY(0.40); // 23 degree angle reveals rim bevel, milled bezel, and 3D star depth
    coin.scale.set(1.5, 1.5, 1.5);

    scene.add(coin);
  });
  await page.waitForTimeout(100);

  const shot1 = path.join(ARTIFACT_DIR, 'task3_01_coin_close_up.png');
  await page.screenshot({ path: shot1 });
  console.log('📸 Captured: task3_01_coin_close_up.png');

  // Remove inspection coin
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const c = scene.getObjectByName('INSPECTION_COIN');
    if (c) scene.remove(c);
  });

  // -------------------------------------------------------------
  // SHOT 2: Gameplay Coin Trail Approach
  // Straight lane coin lines with circular faces and no thin-edge invisibility
  // -------------------------------------------------------------
  console.log('4. Capturing runner approaching straight lane coin trail...');
  await page.waitForTimeout(400);
  const shot2 = path.join(ARTIFACT_DIR, 'task3_02_coin_trail_approach.png');
  await page.screenshot({ path: shot2 });
  console.log('📸 Captured: task3_02_coin_trail_approach.png');

  // -------------------------------------------------------------
  // SHOT 3: Parabolic Jump Arc over Hurdle
  // Trigger jump over hurdle coin arc
  // -------------------------------------------------------------
  console.log('5. Capturing jump arc through coins...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(180); // Mid-flight apex vaulting hurdle
  const shot3 = path.join(ARTIFACT_DIR, 'task3_03_jump_arc_hurdle.png');
  await page.screenshot({ path: shot3 });
  console.log('📸 Captured: task3_03_jump_arc_hurdle.png');

  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // SHOT 4: Coin Collection & HUD Bump
  // Trigger coin pickup with VFX burst & HUD pulse
  // -------------------------------------------------------------
  console.log('6. Capturing coin pickup VFX and HUD pulse...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const bus = window.__METRO_BUS__;
    const events = window.__METRO_EVENTS__;
    const player = game.player;

    // Award 5 coins to ensure counter increment is obvious
    for (let i = 0; i < 5; i++) {
      bus.emit(events.COIN_COLLECTED, {
        position: player.position.clone(),
        value: 1
      });
    }
    const p = player.position.clone();
    p.y += 0.8;
    p.z -= 0.6;
    game.trackManager.triggerCoinPickupVFX(p);
  });
  await page.waitForTimeout(60); // mid-VFX halo and sparkle burst
  const shot4 = path.join(ARTIFACT_DIR, 'task3_04_coin_pickup_hud.png');
  await page.screenshot({ path: shot4 });
  console.log('📸 Captured: task3_04_coin_pickup_hud.png');

  // -------------------------------------------------------------
  // SHOT 5: Magnet Attraction
  // Activate Coin Magnet power-up and capture smooth 3D pull
  // -------------------------------------------------------------
  console.log('7. Capturing Magnet attraction across lanes...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.activate('MAGNET');
  });
  await page.waitForTimeout(500); // Allow magnet to pull adjacent lane coins smoothly to chest
  const shot5 = path.join(ARTIFACT_DIR, 'task3_05_magnet_pull.png');
  await page.screenshot({ path: shot5 });
  console.log('📸 Captured: task3_05_magnet_pull.png');

  await browser.close();
  console.log('🎉 Task 3 visual evidence successfully captured!');
}

captureTask3Coins().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
