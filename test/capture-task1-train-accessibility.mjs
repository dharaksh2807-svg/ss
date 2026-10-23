import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

async function captureTask1AccessibilityEvidence() {
  console.log('📸 Capturing Task 1 Train Accessibility, Visual Readability & Climbable Route Evidence...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Freeze game loop for clean deterministic visual evidence
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.cameraController.update = () => {};
    game.trackManager.update = () => {};
    game.player.update = () => {};
    game.gameOver = () => {};

    // Clear initial chunks
    game.trackManager.chunks.forEach(c => c.clearDynamicItems());
    window.__customTrains = [];
  });
  await page.waitForTimeout(400);

  const stageScene = async (fn) => {
    await page.evaluate(fn);
    await page.waitForTimeout(400);
  };

  // 1. Climbable Train Ramp with Affordances, Structural Bents & Coin Ascent
  console.log('Capturing Evidence 1: Climbable Ramp Visual Affordances & Structural Bents...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    // Spawn 22m climbable ramp train in center lane
    const rampTrain = game.trackManager.obstacleFactory.createTrain(22.0, true, 0x1e3a5f, 'MODERN_METRO');
    rampTrain.position.set(0, 0, -25.0);
    chunk0.group.add(rampTrain);
    window.__customTrains.push(rampTrain);

    // Position player right before the ramp toe plate
    game.player.mesh.visible = true;
    game.player.position.set(0, 0.9, -4.5);
    game.player.update(0);

    // Frame camera in dramatic over-the-shoulder chase view showing the ramp, yellow skirts, and under-deck bents
    const cam = game.cameraController.camera;
    cam.position.set(1.4, 3.2, 1.8);
    cam.lookAt(0, 2.4, -15.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'train_ramp_approach_affordances.png') });
  console.log('Saved train_ramp_approach_affordances.png');

  // 2. Solid Hazard Train with Heavy Anti-Climb Bumper vs Climbable Ramp Side-by-Side
  console.log('Capturing Evidence 2: Solid Hazard Train vs Climbable Ramp Contrast...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    // Lane -1: Solid non-climbable train with prominent hazard bumper & red cab
    const solidTrain = game.trackManager.obstacleFactory.createTrain(22.0, false, 0xd32f2f, 'MODERN_METRO');
    solidTrain.position.set(-2.2, 0, -25.0);
    chunk0.group.add(solidTrain);
    window.__customTrains.push(solidTrain);

    // Lane 1: Ramp-accessible climbable train with diamond-plate incline & amber reflectors
    const rampTrain = game.trackManager.obstacleFactory.createTrain(22.0, true, 0x10ac84, 'CLASSIC_TRANSIT');
    rampTrain.position.set(2.2, 0, -25.0);
    chunk0.group.add(rampTrain);
    window.__customTrains.push(rampTrain);

    game.player.mesh.visible = true;
    game.player.position.set(0, 0.9, -5.0);
    game.player.update(0);

    const cam = game.cameraController.camera;
    cam.position.set(0, 3.4, 2.5);
    cam.lookAt(0, 2.2, -18.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'train_solid_vs_ramp_contrast.png') });
  console.log('Saved train_solid_vs_ramp_contrast.png');

  // 3. Rooftop Catwalk, Ramp-to-Roof Transition Plate & Rear Hazard Threshold
  console.log('Capturing Evidence 3: Rooftop Catwalk Runway & Transition Plates...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__customTrains) {
      window.__customTrains.forEach(t => chunk0.group.remove(t));
    }
    window.__customTrains = [];

    const rampTrain = game.trackManager.obstacleFactory.createTrain(24.0, true, 0xe67e22, 'STREAMLINED_EXPRESS');
    rampTrain.position.set(0, 0, -25.0);
    chunk0.group.add(rampTrain);
    window.__customTrains.push(rampTrain);

    // Runner running across the anti-slip roof catwalk
    game.player.mesh.visible = true;
    game.player.position.set(0, 4.35, -24.0);
    game.player.state = 'ON_TRAIN';
    game.player.update(0);

    const cam = game.cameraController.camera;
    cam.position.set(1.8, 6.8, -13.0);
    cam.lookAt(0, 4.6, -30.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'train_rooftop_catwalk_transition.png') });
  console.log('Saved train_rooftop_catwalk_transition.png');

  // 4. Onboarding Cue HUD Micro-Pill In Action
  console.log('Capturing Evidence 4: Non-Intrusive Onboarding Cue HUD Micro-Pill...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    // Trigger onboarding cue
    game.hud.show();
    game.hud.showRampCue();

    const cam = game.cameraController.camera;
    cam.position.set(0, 3.0, 1.5);
    cam.lookAt(0, 2.2, -18.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'train_onboarding_cue_hud.png') });
  console.log('Saved train_onboarding_cue_hud.png');

  await browser.close();
  console.log('✨ All 4 Task 1 Visual Verification Screenshots Successfully Captured!');
}

captureTask1AccessibilityEvidence().catch(err => {
  console.error('Error capturing evidence:', err);
  process.exit(1);
});
