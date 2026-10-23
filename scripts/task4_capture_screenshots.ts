import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/57153f5e-91de-46af-85e9-d6fd6861c935';

async function runScreenshotCapture() {
  console.log('🚀 Starting Task 4 Screenshot Capture for Jump Arcs & Power-Ups...');
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=metal']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser ERROR]: ${msg.text()}`);
    }
  });

  console.log('Connecting to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Start Run and Capture Jump Coin Arc Approach
  console.log('📸 1. Capturing Jump Coin Arc Approach...');
  await page.evaluate(() => {
    localStorage.removeItem('metro_runner_seen_powerups');
    const game = (window as any).__METRO_GAME__;
    game.startRun('NORMAL');
    if (game.getOpeningSequence()) {
      game.getOpeningSequence().skip();
    }
    const player = game.getPlayer();
    player.powerups.grantInvulnerability(90);
    player.position.set(0, 0, -20.0);
    player.speed = 18.0;
    const cam = game.getCameraController();
    cam.finishIntro(player.position);
    cam.update(player.position, 0.016, 0, player.speed, player.groundY);
  });
  await page.waitForTimeout(600);
  const shot1 = path.join(ARTIFACTS_DIR, 'task4_01_jump_coin_arc_approach.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved: ${shot1}`);

  // 2. Capture Airborne Jump across Arc
  console.log('📸 2. Capturing Airborne Jump across Arc...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(0, 2.25, -27.1); // At apex of hurdle arc
    player.isJumping = true;
    player.jumpPhase = 'APEX';
    const cam = game.getCameraController();
    cam.finishIntro(player.position);
    cam.update(player.position, 0.016, 0, player.speed, player.groundY);
  });
  await page.waitForTimeout(400);
  const shot2 = path.join(ARTIFACTS_DIR, 'task4_02_jump_coin_arc_airborne.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved: ${shot2}`);

  // 3. Trigger Powerup and First-Use Guidance (Single clean discovery toast)
  console.log('📸 3. Capturing First-Use Guidance Toast...');
  await page.evaluate(() => {
    document.querySelectorAll('.first-use-guidance-toast').forEach(el => el.remove());
    const bus = (window as any).__METRO_BUS__;
    const events = (window as any).__METRO_EVENTS__;
    bus.emit(events.POWERUP_COLLECTED, 'MAGNET');
  });
  await page.waitForTimeout(400);
  const shot3 = path.join(ARTIFACTS_DIR, 'task4_03_first_use_guidance.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved: ${shot3}`);

  // 4. Capture HUD with Active Power-up Timer, LV badge, and Countdown (No toasts obscuring)
  console.log('📸 4. Capturing HUD Power-Up Readability...');
  await page.evaluate(() => {
    // Dismiss all toasts
    document.querySelectorAll('.first-use-guidance-toast').forEach(el => el.remove());
    const game = (window as any).__METRO_GAME__;
    const player = game.getPlayer();
    player.speed = 0; // Hold position for clean presentation
    player.powerups.activate('SNEAKERS', 15.0);
    player.powerups.activate('MULTIPLIER', 12.0);
    // Directly dismiss any newly triggered toast
    document.querySelectorAll('.first-use-guidance-toast').forEach(el => el.remove());
    game.hud.update(0.016);
    const cam = game.getCameraController();
    cam.finishIntro(player.position);
    cam.update(player.position, 0.016, 0, 0, player.groundY);
  });
  await page.waitForTimeout(400);
  const shot4 = path.join(ARTIFACTS_DIR, 'task4_04_hud_powerup_readability.png');
  await page.screenshot({ path: shot4 });
  console.log(`Saved: ${shot4}`);

  // 5. Capture 3D Power-Up Showcase Gallery in Scene
  console.log('📸 5. Capturing 3D Power-Up Showcase Gallery...');
  await page.evaluate(() => {
    document.querySelectorAll('.first-use-guidance-toast').forEach(el => el.remove());
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene.scene;
    const trackManager = game.getTrackManager();
    const colFactory = (trackManager as any).collectibleFactory;
    const player = game.getPlayer();

    // Freeze player motion for static 3D photo shot
    player.speed = 0;
    const targetZ = player.position.z - 7.5;

    // Place all 7 3D powerup collectibles neatly in front of player
    const items = [
      { obj: colFactory.createPowerup('MAGNET'), x: -4.2, name: 'Magnet' },
      { obj: colFactory.createPowerup('JETPACK'), x: -2.8, name: 'Jetpack' },
      { obj: colFactory.createPowerup('SNEAKERS'), x: -1.4, name: 'Sneakers' },
      { obj: colFactory.createPowerup('MULTIPLIER'), x: 0.0, name: 'Multiplier' },
      { obj: colFactory.createPowerup('SHIELD'), x: 1.4, name: 'Shield' },
      { obj: colFactory.createPowerup('HOVERBOARD'), x: 2.8, name: 'Hoverboard' },
      { obj: colFactory.createKey(), x: 4.2, name: 'Key' }
    ];

    items.forEach((item) => {
      item.obj.position.set(item.x, 1.4, targetZ);
      item.obj.scale.set(1.5, 1.5, 1.5);
      scene.add(item.obj);
    });

    const cam = game.getCameraController();
    cam.finishIntro(player.position);
    cam.update(player.position, 0.016, 0, 0, player.groundY);
  });
  await page.waitForTimeout(600);
  const shot5 = path.join(ARTIFACTS_DIR, 'task4_05_powerup_3d_gallery.png');
  await page.screenshot({ path: shot5 });
  console.log(`Saved: ${shot5}`);

  // 6. Capture Shop / Upgrades Modal with Original Vector Icons
  console.log('📸 6. Capturing Shop Modal Vector Icons...');
  await page.evaluate(() => {
    document.querySelectorAll('.first-use-guidance-toast').forEach(el => el.remove());
    const game = (window as any).__METRO_GAME__;
    game.shopModal.show('UPGRADES');
  });
  await page.waitForTimeout(500);
  const shot6 = path.join(ARTIFACTS_DIR, 'task4_06_shop_vector_icons.png');
  await page.screenshot({ path: shot6 });
  console.log(`Saved: ${shot6}`);

  await browser.close();
  console.log('🎉 All Task 4 screenshots captured successfully!');
}

runScreenshotCapture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
