import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function captureTask5Evidence() {
  console.log('📸 Capturing Task 5 Professional Train Visual Verification Evidence...');

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
    // Freeze animation loop updates so manual scene staging is rock-solid
    game.cameraController.update = () => {};
    game.trackManager.update = () => {};
    game.player.update = () => {};
    game.gameOver = () => {};
    // Inject CSS to guarantee all modals/overlays stay hidden
    const style = document.createElement('style');
    style.innerHTML = '.screen-overlay, #hud, #game-over-modal, #pause-modal { display: none !important; }';
    document.head.appendChild(style);
    window.__customTrains = [];
  });
  await page.waitForTimeout(400);

  // Helper to safely replace showcase trains
  const stageTrain = async (fn) => {
    await page.evaluate(fn);
    await page.waitForTimeout(300);
  };

  // 1. Modern Commuter Metro (Front 3/4 Dramatic Angle)
  console.log('Capturing Evidence 1: Modern Metro Front & Windshield...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const modernTrain = game.trackManager.obstacleFactory.createTrain(24.0, false, 0xd32f2f, 'MODERN_METRO');
    modernTrain.position.set(0, 0, -25.0);
    chunk0.group.add(modernTrain);
    window.__customTrains.push(modernTrain);

    // Hide player so the train takes center stage
    game.player.mesh.visible = false;

    const cam = game.cameraController.camera;
    // Train front nose is at Z = -25 + 12 + 1.35 = -11.65m
    cam.position.set(-2.5, 2.4, -6.5);
    cam.lookAt(0, 2.0, -12.0);
  });
  const shot1 = path.join(ARTIFACT_DIR, 'task5_evidence_01_modern_metro_front.png');
  await page.screenshot({ path: shot1 });

  // 2. Classic Urban Transit Carriage (Corrugated Stainless Fluting & Heavy Cowcatcher)
  console.log('Capturing Evidence 2: Classic Transit Corrugated Fluting...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const classicTrain = game.trackManager.obstacleFactory.createTrain(24.0, false, 0xff8f00, 'CLASSIC_TRANSIT');
    classicTrain.position.set(0, 0, -25.0);
    chunk0.group.add(classicTrain);
    window.__customTrains.push(classicTrain);

    game.player.mesh.visible = false;

    const cam = game.cameraController.camera;
    // Front 3/4 view showcasing split dual-pane windshield, hazard cowcatcher, and stainless fluting
    cam.position.set(-2.8, 2.2, -7.0);
    cam.lookAt(0, 2.0, -12.5);
  });
  const shot2 = path.join(ARTIFACT_DIR, 'task5_evidence_02_classic_transit_fluting.png');
  await page.screenshot({ path: shot2 });

  // 3. Streamlined Express / Light Rail (Raked Wedge Bullet Nose & Cockpit Canopy)
  console.log('Capturing Evidence 3: Streamlined Express Bullet Rake...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const expressTrain = game.trackManager.obstacleFactory.createTrain(24.0, false, 0x0288d1, 'STREAMLINED_EXPRESS');
    expressTrain.position.set(0, 0, -25.0);
    chunk0.group.add(expressTrain);
    window.__customTrains.push(expressTrain);

    game.player.mesh.visible = false;

    const cam = game.cameraController.camera;
    // Dynamic 3/4 angle showing aggressive 24-deg rake wedge, slit LEDs, destination sign & canopy
    cam.position.set(2.6, 2.2, -6.8);
    cam.lookAt(0, 2.0, -12.2);
  });
  const shot3 = path.join(ARTIFACT_DIR, 'task5_evidence_03_streamlined_express_rake.png');
  await page.screenshot({ path: shot3 });

  // 4. Rooftop Walkway Profile & Low-Profile HVAC Equipment (Y = 4.35m surface)
  console.log('Capturing Evidence 4: Rooftop Catwalk & Low-Profile Equipment...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const modernTrain = game.trackManager.obstacleFactory.createTrain(24.0, false, 0xd32f2f, 'MODERN_METRO');
    modernTrain.position.set(0, 0, -25.0);
    chunk0.group.add(modernTrain);
    window.__customTrains.push(modernTrain);

    game.player.mesh.visible = false;

    const cam = game.cameraController.camera;
    // High-angle view looking down the length of the anti-slip roof catwalk (at 4.35m)
    cam.position.set(0, 5.8, -10.0);
    cam.lookAt(0, 4.35, -24.0);
  });
  const shot4 = path.join(ARTIFACT_DIR, 'task5_evidence_04_rooftop_traversal_deck.png');
  await page.screenshot({ path: shot4 });

  // 5. Player Running Beside Train (Scale, Flanged Rail Wheels & Bogies)
  console.log('Capturing Evidence 5: Player Running Beside Train...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const train = game.trackManager.obstacleFactory.createTrain(24.0, false, 0xd32f2f, 'MODERN_METRO');
    train.position.set(-3.6, 0, -24.0);
    chunk0.group.add(train);
    window.__customTrains.push(train);

    // Position and show running player in center lane
    const player = game.getPlayer();
    player.reset();
    player.mesh.visible = true;
    player.position.set(0, 0.85, -18.0);
    player.mesh.position.copy(player.position);
    player.state = 'RUN';
    player.model.update(0.016, 'RUNNING', false, false, 0, 0, 0);

    const cam = game.cameraController.camera;
    cam.position.set(2.4, 2.0, -11.5);
    cam.lookAt(-1.6, 1.8, -18.0);
  });
  const shot5 = path.join(ARTIFACT_DIR, 'task5_evidence_05_player_running_beside_train.png');
  await page.screenshot({ path: shot5 });

  // 6. Gameplay-Distance Readability (Running Behind Player approaching Trains)
  console.log('Capturing Evidence 6: Gameplay-Distance Collision Readability...');
  await stageTrain(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    // Left lane: Modern Metro
    const tLeft = game.trackManager.obstacleFactory.createTrain(24.0, false, 0xd32f2f, 'MODERN_METRO');
    tLeft.position.set(-3.6, 0, -32.0);
    chunk0.group.add(tLeft);
    window.__customTrains.push(tLeft);

    // Right lane: Streamlined Express with ramp
    const tRight = game.trackManager.obstacleFactory.createTrain(24.0, true, 0x0288d1, 'STREAMLINED_EXPRESS');
    tRight.position.set(3.6, 0, -36.0);
    chunk0.group.add(tRight);
    window.__customTrains.push(tRight);

    // Center lane player running
    const player = game.getPlayer();
    player.reset();
    player.mesh.visible = true;
    player.position.set(0, 0.85, -14.0);
    player.mesh.position.copy(player.position);
    player.state = 'RUN';
    player.model.update(0.016, 'RUNNING', false, false, 0, 0, 0);

    const cam = game.cameraController.camera;
    cam.position.set(0, 3.4, -6.5);
    cam.lookAt(0, 2.0, -30.0);
  });
  const shot6 = path.join(ARTIFACT_DIR, 'task5_evidence_06_gameplay_distance_readability.png');
  await page.screenshot({ path: shot6 });

  console.log('🎉 All 6 Task 5 evidence screenshots captured successfully!');
  await browser.close();
}

captureTask5Evidence().catch((err) => {
  console.error('❌ Error during Task 5 evidence capture:', err);
  process.exit(1);
});
