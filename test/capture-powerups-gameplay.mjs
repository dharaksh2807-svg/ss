import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function capturePowerupsGameplay() {
  console.log('📸 Capturing live Power-Up gameplay and UX showcase shots...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // -------------------------------------------------------------
  // SHOT 1: Upgrade Shop Modal
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Upgrade Shop Modal...');
  await page.evaluate(() => {
    localStorage.setItem('metro_runner_wallet', '2450');
    const bus = window.__METRO_BUS__;
    if (bus) bus.emit('OPEN_SHOP', 'START');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'powerup_shop_upgrades_modal.png'), fullPage: false });

  // -------------------------------------------------------------
  // Start the run cleanly
  // -------------------------------------------------------------
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    document.getElementById('shop-modal')?.classList.add('hidden');
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('hud')?.classList.remove('hidden');
    game.startRun();
    // Pause game loop so we can freeze-frame each powerup showcase with HUD badges
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
    game.cameraController.update = () => {};
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // SHOT 2: Jetpack High-Altitude Flight + HUD Jetpack Card
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Rocket Jetpack Flight...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.powerups.activate('JETPACK');
    // Step forward so altitude reaches 9.0m
    for (let i = 0; i < 40; i++) {
      game.player.update(0.05);
    }
    game.hud.update();
    const cam = game.cameraController.camera;
    // Position camera 3/4 behind player showing rocket backpack and cyan exhaust plumes
    cam.position.set(2.4, game.player.position.y + 1.2, game.player.position.z + 5.0);
    cam.lookAt(game.player.position.x, game.player.position.y + 0.6, game.player.position.z - 6.0);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'powerup_jetpack_flight.png'), fullPage: false });

  // -------------------------------------------------------------
  // SHOT 3: Protective Shield Force Field + HUD Shield Card
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Protective Shield...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.state = 'RUN';
    game.player.position.y = 0.9;
    game.player.powerups.activate('SHIELD');
    game.player.update(0.016);
    game.hud.update();
    const cam = game.cameraController.camera;
    // Position camera slightly to side and behind to clearly capture the spherical shield bubble
    cam.position.set(1.6, 2.0, game.player.position.z + 4.0);
    cam.lookAt(game.player.position.x, game.player.position.y + 0.7, game.player.position.z - 4.0);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'powerup_shield_energy_bubble.png'), fullPage: false });

  // -------------------------------------------------------------
  // SHOT 4: Coin Magnet & 2X Multiplier Dual Power-Up Cards
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: Coin Magnet & Multiplier...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.state = 'RUN';
    game.player.position.y = 0.9;
    game.player.powerups.activate('MAGNET');
    game.player.powerups.activate('MULTIPLIER');
    game.player.update(0.016);
    game.hud.setMultiplier(2);
    game.hud.update();
    const cam = game.cameraController.camera;
    cam.position.set(-1.8, 2.2, game.player.position.z + 4.4);
    cam.lookAt(game.player.position.x, game.player.position.y + 0.8, game.player.position.z - 5.0);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'powerup_magnet_aura_pull.png'), fullPage: false });

  // -------------------------------------------------------------
  // SHOT 5: Super Sneakers High-Jump + HUD Sneakers Card
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: Super Sneakers High-Jump...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.powerups.reset();
    game.player.powerups.activate('SNEAKERS');
    game.player.position.y = 0.9;
    game.player.jump();
    // Step forward 14 ticks to reach apex
    for (let i = 0; i < 14; i++) {
      game.player.update(0.03);
    }
    game.hud.update();
    const cam = game.cameraController.camera;
    cam.position.set(2.4, game.player.position.y + 0.5, game.player.position.z + 5.2);
    cam.lookAt(game.player.position.x, game.player.position.y, game.player.position.z - 6.0);
    game.worldScene.renderer.render(game.worldScene.scene, cam);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'powerup_sneakers_jump.png'), fullPage: false });

  await browser.close();
  console.log('✅ All live gameplay shots captured successfully!');
}

capturePowerupsGameplay().catch((err) => {
  console.error('Error capturing powerup shots:', err);
  process.exit(1);
});
