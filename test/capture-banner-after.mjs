import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/6aa8f275-4ff8-4bbc-af07-b2936cce22ac';

async function captureAfter() {
  console.log('📸 Capturing AFTER banner screenshots...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined, { timeout: 10000 });

  // Start play
  const playBtn = page.locator('#start-play-btn');
  if (await playBtn.isVisible()) {
    await playBtn.click();
  }
  await page.waitForTimeout(400);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);

  // Set up clean approach scene
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (!game) return;

    // Freeze game loop
    game.cameraController.update = () => {};
    game.trackManager.update = () => {};
    game.player.update = () => {};
    game.gameOver = () => {};

    const chunk0 = game.trackManager.chunks[0];
    game.trackManager.chunks.forEach(c => c.clearDynamicItems());

    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach(obs => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Stage HIGH_BARRIER at 18m ahead in center lane (with new 1.40m clearance and warning markings)
    const highBarrier = game.trackManager.obstacleFactory.createHighBarrier(0);
    highBarrier.position.set(0, 0, -18.0);
    chunk0.group.add(highBarrier);
    window.__stagedObstacles.push(highBarrier);

    // Place player at center lane, standing
    game.player.position.set(0, 0.9, 0);
    game.player.mesh.position.set(0, 0.9, 0);
    game.player.currentLane = 0;
    game.player.targetLane = 0;
    game.player.isSliding = false;
    game.player.isJumping = false;

    // Gameplay camera
    const cam = game.cameraController.camera;
    cam.position.set(0, 0.9 + 3.25, 5.60);
    cam.lookAt(0, 0.9 + 1.65, -18.0);
  });

  await page.waitForTimeout(300);
  const approachShot = path.join(ARTIFACT_DIR, 'after_banner_approach.png');
  await page.screenshot({ path: approachShot });
  console.log(`✅ Saved after approach shot to ${approachShot}`);

  // Shot 2: Close-up slide clearance
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach(obs => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    const highBarrier = game.trackManager.obstacleFactory.createHighBarrier(0);
    highBarrier.position.set(0, 0, -4.5);
    chunk0.group.add(highBarrier);
    window.__stagedObstacles.push(highBarrier);

    game.player.position.set(0, 0.9, 0);
    game.player.mesh.position.set(0, 0.9, 0);
    game.player.slide();
    game.player.isSliding = true;
    game.player.model.updateAnimation('SLIDE_HOLD', 20, 0, 0.9, 0.016);

    const cam = game.cameraController.camera;
    cam.position.set(0, 0.9 + 2.5, 4.0);
    cam.lookAt(0, 1.2, -4.5);
  });

  await page.waitForTimeout(300);
  const slideShot = path.join(ARTIFACT_DIR, 'after_banner_slide.png');
  await page.screenshot({ path: slideShot });
  console.log(`✅ Saved after slide shot to ${slideShot}`);

  // Shot 3: All 3 Visual Variants Showcase (Station Transit, Industrial Truss, Tunnel Vault)
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach(obs => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Left Lane: Variant 1 (Industrial Truss)
    const var1 = game.trackManager.obstacleFactory.createHighBarrier(1);
    var1.position.set(-3.6, 0, -18.0);
    chunk0.group.add(var1);
    window.__stagedObstacles.push(var1);

    // Center Lane: Variant 0 (Station Signal Gantry)
    const var0 = game.trackManager.obstacleFactory.createHighBarrier(0);
    var0.position.set(0, 0, -18.0);
    chunk0.group.add(var0);
    window.__stagedObstacles.push(var0);

    // Right Lane: Variant 2 (Tunnel Clearance Beam)
    const var2 = game.trackManager.obstacleFactory.createHighBarrier(2);
    var2.position.set(3.6, 0, -18.0);
    chunk0.group.add(var2);
    window.__stagedObstacles.push(var2);

    game.player.position.set(0, 0.9, 0);
    game.player.mesh.position.set(0, 0.9, 0);
    game.player.currentLane = 0;
    game.player.targetLane = 0;
    game.player.isSliding = false;

    const cam = game.cameraController.camera;
    cam.position.set(0, 0.9 + 3.25, 5.60);
    cam.lookAt(0, 0.9 + 1.65, -18.0);
  });

  await page.waitForTimeout(300);
  const variantsShot = path.join(ARTIFACT_DIR, 'after_banner_variants.png');
  await page.screenshot({ path: variantsShot });
  console.log(`✅ Saved after variants shot to ${variantsShot}`);

  await browser.close();
}

captureAfter().catch(err => {
  console.error('Failed to capture after:', err);
  process.exit(1);
});
