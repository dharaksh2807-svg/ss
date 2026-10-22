import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureShowcase() {
  console.log('📸 Capturing dedicated high-detail showcase shots...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Start the game
  await page.click('#start-play-btn', { force: true });
  await page.waitForSelector('#hud:not(.hidden)');

  // Let game initialize first 3 chunks and obstacles
  await page.waitForTimeout(300);

  // Freeze the game and bypass camera controller updates
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
    // Freeze cameraController update so camera stays fixed where we put it
    game.cameraController.update = () => {};
  });

  // --- SHOT 1: Train Close-up ---
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const camera = game.cameraController.camera;

    // Traverse to find a train
    let trainGroup = null;
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.isTrain && !trainGroup) {
        trainGroup = obj;
      }
    });

    if (trainGroup) {
      const pos = camera.position.clone();
      trainGroup.getWorldPosition(pos);
      console.log('Found train at:', pos);
      // Position camera 3/4 angle in front of train nose
      camera.position.set(pos.x + 3.2, pos.y + 2.4, pos.z + 8.5);
      camera.lookAt(pos.x, pos.y + 1.8, pos.z);
    } else {
      console.log('No train spawned yet, positioning along track');
      camera.position.set(2.4, 2.8, -35);
      camera.lookAt(0, 2.0, -60);
    }
    game.worldScene.renderer.render(scene, camera);
  });

  await page.waitForTimeout(100);
  const trainPath = path.join(ARTIFACT_DIR, 'audit_after_train_closeup.png');
  await page.screenshot({ path: trainPath });
  console.log(`Saved train closeup: ${trainPath}`);

  // --- SHOT 2: Elevated Skyline & Corridor Overview ---
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const camera = game.cameraController.camera;
    // Elevated cinematic view looking down the railway canyon
    camera.position.set(-6.5, 9.5, -5);
    camera.lookAt(0, 3.2, -65);
    game.worldScene.renderer.render(scene, camera);
  });

  await page.waitForTimeout(100);
  const skylinePath = path.join(ARTIFACT_DIR, 'audit_after_skyline_overview.png');
  await page.screenshot({ path: skylinePath });
  console.log(`Saved skyline overview: ${skylinePath}`);

  // --- SHOT 3: Golden Coin Close-up ---
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    const camera = game.cameraController.camera;

    let coinMesh = null;
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.type === 'COIN' && !coinMesh) {
        coinMesh = obj;
      }
    });

    if (coinMesh) {
      const pos = camera.position.clone();
      coinMesh.getWorldPosition(pos);
      camera.position.set(pos.x + 0.8, pos.y + 0.5, pos.z + 1.6);
      camera.lookAt(pos.x, pos.y, pos.z);
    } else {
      camera.position.set(0, 2.0, -10);
      camera.lookAt(0, 1.5, -20);
    }
    game.worldScene.renderer.render(scene, camera);
  });

  await page.waitForTimeout(100);
  const coinPath = path.join(ARTIFACT_DIR, 'audit_after_coin_closeup.png');
  await page.screenshot({ path: coinPath });
  console.log(`Saved coin closeup: ${coinPath}`);

  await browser.close();
  console.log('🎉 Dedicated showcase captures completed successfully!');
}

captureShowcase().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
