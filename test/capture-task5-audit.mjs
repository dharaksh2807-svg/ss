import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function captureTask5Audit() {
  console.log('📸 Capturing Task 5 Initial Train Audit Screenshots...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Start run
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
  });
  await page.waitForTimeout(500);

  // 1. Approaching train front (Close-up front angle)
  console.log('Capturing Audit 1: Approaching train front...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.pause();
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    // Camera framed directly looking at front of train at Z=-60
    cam.position.set(-2.2, 2.2, -48.0);
    cam.lookAt(-2.2, 2.0, -60.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot1 = path.join(ARTIFACT_DIR, 'task5_audit_01_approaching_front.png');
  await page.screenshot({ path: shot1 });

  // 2. Train side (3/4 quarter side view)
  console.log('Capturing Audit 2: Train side...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    cam.position.set(-5.5, 2.2, -62.0);
    cam.lookAt(-2.2, 2.0, -66.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot2 = path.join(ARTIFACT_DIR, 'task5_audit_02_train_side.png');
  await page.screenshot({ path: shot2 });

  // 3. Train roof (Rooftop walkway & equipment profile)
  console.log('Capturing Audit 3: Train roof...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    cam.position.set(-2.2, 6.2, -50.0);
    cam.lookAt(-2.2, 4.4, -65.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot3 = path.join(ARTIFACT_DIR, 'task5_audit_03_train_roof.png');
  await page.screenshot({ path: shot3 });

  // 4. Adjacent train (Looking across tracks at parallel train)
  console.log('Capturing Audit 4: Adjacent train...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    cam.position.set(0, 2.2, -52.0);
    cam.lookAt(2.2, 2.0, -65.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot4 = path.join(ARTIFACT_DIR, 'task5_audit_04_adjacent_train.png');
  await page.screenshot({ path: shot4 });

  // 5. Train under dynamic lighting
  console.log('Capturing Audit 5: Train under dynamic lighting...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    cam.position.set(-0.5, 3.8, -50.0);
    cam.lookAt(-2.2, 2.5, -62.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot5 = path.join(ARTIFACT_DIR, 'task5_audit_05_train_dynamic_lighting.png');
  await page.screenshot({ path: shot5 });

  // 6. Player beside a train
  console.log('Capturing Audit 6: Player beside a train...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const scene = game.worldScene.scene;
    const renderer = game.worldScene.renderer;
    const cam = game.cameraController.camera;

    player.position.set(0, 0.85, -60.0);
    player.mesh.position.copy(player.position);
    player.update(0.016);

    cam.position.set(0, 2.4, -54.0);
    cam.lookAt(-1.1, 2.0, -62.0);
    renderer.render(scene, cam);
  });
  await page.waitForTimeout(300);
  const shot6 = path.join(ARTIFACT_DIR, 'task5_audit_06_player_beside_train.png');
  await page.screenshot({ path: shot6 });

  console.log('✅ All 6 initial train audit shots captured successfully!');
  await browser.close();
}

captureTask5Audit().catch((err) => {
  console.error('❌ Error during Task 5 audit capture:', err);
  process.exit(1);
});
