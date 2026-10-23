import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b2746edc-5714-4101-b26e-f272cdfb7c56';

async function captureRailwayObstaclesEvidence() {
  console.log('🚀 Starting Task 2 Railway Obstacle System Real-Browser Screenshot Capture...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Initialize and freeze game loop for crisp, stable cinematic captures
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      // Hide lobby UI
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.style.display = 'none';

      // Freeze automatic game loop ticks
      game.cameraController.update = () => {};
      game.trackManager.update = () => {};
      game.player.update = () => {};
      game.gameOver = () => {};

      // Clear initial chunk items
      game.trackManager.chunks.forEach((c) => c.clearDynamicItems());
      window.__stagedObstacles = [];
    }
  });
  await page.waitForTimeout(300);

  const stageScene = async (fn) => {
    await page.evaluate(fn);
    await page.waitForTimeout(400);
  };

  // -------------------------------------------------------------------------
  // Shot 1: Oncoming Moving Train with Strobe Headlights & Clear Flanks
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 1: Oncoming Moving Train (MOVING_TRAIN_SIDE_CHOICE)...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach((obs) => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Create oncoming moving train in center lane
    const movingData = game.trackManager.obstacleFactory.createMovingTrain(22.0, 0x1e3a5f);
    const trainGroup = movingData.group;
    trainGroup.position.set(0, 0, -20.0);
    chunk0.group.add(trainGroup);
    window.__stagedObstacles.push(trainGroup);

    // Strobe headlights illuminated
    movingData.headlights.forEach((h) => {
      if (h.material) {
        h.material.color.setHex(0xffffff);
        if (h.material.emissive) h.material.emissive.setHex(0xffe082);
      }
    });

    // Position player in left safe lane watching oncoming train
    game.player.mesh.visible = true;
    game.player.position.set(-3.6, 0.9, -4.0);
    game.player.targetLane = -1;
    game.player.currentLane = -1;

    // Camera framed over-the-shoulder
    const cam = game.cameraController.camera;
    cam.position.set(-3.0, 2.5, 3.5);
    cam.lookAt(0.0, 1.8, -20.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_moving_train_oncoming.png') });

  // -------------------------------------------------------------------------
  // Shot 2: Realistic 3D Railway Structural Pillar Hazard
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 2: Railway Structural Pillar Hazard (PILLAR_CENTRAL_SPLIT)...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach((obs) => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Create concrete/steel structural pillar in center lane
    const pillar = game.trackManager.obstacleFactory.createPillar();
    pillar.position.set(0, 0, -18.0);
    chunk0.group.add(pillar);
    window.__stagedObstacles.push(pillar);

    // Position player in left lane to provide clear line of sight to central pillar
    game.player.position.set(-3.6, 0.9, -6.0);
    game.player.targetLane = -1;
    game.player.currentLane = -1;

    const cam = game.cameraController.camera;
    cam.position.set(-2.0, 2.8, 2.0);
    cam.lookAt(0, 2.6, -18.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_structural_pillars_hazard.png') });

  // -------------------------------------------------------------------------
  // Shot 3: Modular Subway Tunnel with Entrance Portal & Vaulted Ceiling
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 3: Modular Subway Tunnel Entrance & Interior...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach((obs) => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Populate chunk 0 as subway tunnel with entrance portal
    chunk0.populate({
      name: 'TUNNEL_ENTRY_SLIDE_HAZARD',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'HIGH_BARRIER', lane: 0, zOffset: 28.0 }
      ],
      collectibles: [],
      isTunnel: true,
      tunnelPortal: 'ENTRANCE'
    }, 0.0);

    // Position player just outside the tunnel entrance portal
    game.player.position.set(0, 0.9, 8.0);
    game.player.targetLane = 0;

    const cam = game.cameraController.camera;
    cam.position.set(0, 3.2, 18.0);
    cam.lookAt(0, 2.8, -25.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_subway_tunnel_entrance.png') });

  // -------------------------------------------------------------------------
  // Shot 4: Three Distinct Barrier Classes (Low Hurdle, Medium, High Slide)
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 4: Three Distinct Barrier Classes Display...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];

    // Rebuild standard scenery
    chunk0.populate({
      name: 'THREE_BARRIER_CLASSES_SHOWCASE',
      difficulty: 'EASY',
      obstacles: [],
      collectibles: []
    }, 0.0);

    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach((obs) => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Left Lane: Low Jump Hurdle (1.1m)
    const low = game.trackManager.obstacleFactory.createLowBarrier();
    low.position.set(-3.6, 0, -16.0);
    chunk0.group.add(low);
    window.__stagedObstacles.push(low);

    // Center Lane: Medium Turnstile Barrier (1.65m)
    const med = game.trackManager.obstacleFactory.createMediumBarrier();
    med.position.set(0, 0, -16.0);
    chunk0.group.add(med);
    window.__stagedObstacles.push(med);

    // Right Lane: High Slide-Only Overhead Gantry (Clearance 1.25m, Height 3.8m)
    const high = game.trackManager.obstacleFactory.createHighBarrier();
    high.position.set(3.6, 0, -16.0);
    chunk0.group.add(high);
    window.__stagedObstacles.push(high);

    // Position player in left foreground lane to keep all 3 barrier lanes completely visible
    game.player.position.set(-3.6, 0.9, 2.0);
    game.player.targetLane = -1;
    game.player.currentLane = -1;

    const cam = game.cameraController.camera;
    cam.position.set(0.0, 3.0, 6.0);
    cam.lookAt(0.0, 1.6, -16.0);
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_three_barrier_classes.png') });

  await browser.close();
  console.log('✨ All 4 Task 2 railway obstacle screenshots captured successfully!');
}

captureRailwayObstaclesEvidence().catch((err) => {
  console.error('❌ Failed capturing screenshot evidence:', err);
  process.exit(1);
});
