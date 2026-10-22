import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureGameplayDepth() {
  console.log('📸 Capturing live Gameplay Depth & Obstacle Variety showcase shots...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Start the run
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('hud')?.classList.remove('hidden');
    game.startRun();
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
  });
  await page.waitForTimeout(500);

  // -------------------------------------------------------------
  // SHOT 1: Track with Side Barrier, Low Barrier, and Coin Arches
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Track with Side Barrier & Low Barrier Hurdles...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    // Populate chunk ahead with SIDE_BARRIER and LOW_BARRIER
    const pattern = {
      name: 'SHOWCASE_BARRIERS',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'SIDE_BARRIER', lane: -1, zOffset: 15.0 },
        { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
        { type: 'TRAIN', lane: 1, zOffset: 18.0, length: 22.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 12.0, count: 6, spacing: 2.0 },
        { type: 'COIN', lane: 0, zOffset: 22.0, yOffset: 2.2, count: 4, spacing: 1.8, isArc: true }
      ]
    };
    game.trackManager.chunks[0].populate(pattern, 0);
    game.player.position.set(0, 0.9, -8.0);
    game.player.mesh.position.copy(game.player.position);
    game.cameraController.reset(game.player.position);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_obstacle_variety_barriers.png') });

  // -------------------------------------------------------------
  // SHOT 2: Tunnel Arch Clearance with Player Sliding
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Tunnel Arch Clearance Slide...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const pattern = {
      name: 'SHOWCASE_TUNNEL',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'TUNNEL_ARCH', lane: 0, zOffset: 16.0 },
        { type: 'SIDE_BARRIER', lane: -1, zOffset: 16.0 },
        { type: 'TRAIN', lane: 1, zOffset: 14.0, length: 24.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 12.0, yOffset: 0.6, count: 6, spacing: 1.8 }
      ]
    };
    game.trackManager.chunks[0].populate(pattern, 0);
    game.player.position.set(0, 0.9, -13.0);
    game.player.handleInput('DOWN'); // Slide under arch
    game.player.update(0.05);
    game.hud.showFeedbackBadge('PERFECT SLIDE ⚡ +80', 'precision');
    game.cameraController.reset(game.player.position);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_tunnel_arch_sliding.png') });

  // -------------------------------------------------------------
  // SHOT 3: Oncoming Moving Train with Headlight Telegraph
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Oncoming Moving Train Telegraph...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const pattern = {
      name: 'SHOWCASE_MOVING_TRAIN',
      difficulty: 'ADVANCED',
      obstacles: [
        { type: 'MOVING_TRAIN', lane: 0, zOffset: 45.0, length: 22.0, isMoving: true, velocityZ: 11.0 },
        { type: 'LOW_BARRIER', lane: -1, zOffset: 25.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 1, zOffset: 20.0, count: 8, spacing: 2.2 }
      ]
    };
    game.trackManager.chunks[0].populate(pattern, 0);
    game.player.position.set(1, 0.9, -15.0); // Safe lane
    game.player.mesh.position.copy(game.player.position);
    // Update chunk so train telegraph triggers and headlights strobe
    game.trackManager.chunks[0].update(0.1, 1.0, game.player.position.z);
    game.cameraController.reset(game.player.position);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_moving_train_telegraph.png') });

  // -------------------------------------------------------------
  // SHOT 4: Train Roof Ramp Run with Rooftop Coins
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: Train Roof Ramp Run...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const pattern = {
      name: 'SHOWCASE_TRAIN_RAMP',
      difficulty: 'MEDIUM',
      obstacles: [
        { type: 'TRAIN', lane: 0, zOffset: 12.0, length: 28.0, hasRamp: true }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 5.2, count: 8, spacing: 2.2 }
      ]
    };
    game.trackManager.chunks[0].populate(pattern, 0);
    game.player.position.set(0, 4.35, -24.0); // On train roof
    game.player.setGroundHeight(4.35);
    game.player.mesh.position.copy(game.player.position);
    game.hud.showFeedbackBadge('STREAK x3 🔥 +450', 'streak');
    game.cameraController.reset(game.player.position);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_train_top_ramp_run.png') });

  // -------------------------------------------------------------
  // SHOT 5: Full In-Game HUD with Clean Streak, Precision & Near Miss
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: Full In-Game HUD Badges...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.hud.showFeedbackBadge('NEAR MISS! +50', 'nearmiss');
    game.hud.showFeedbackBadge('PERFECT JUMP 🦘 +80', 'precision');
    game.hud.showFeedbackBadge('STREAK x4 🔥 +600', 'streak');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gameplay_streak_and_precision_hud.png') });

  await browser.close();
  console.log('🎉 Successfully captured all 5 gameplay depth screenshots to brain artifacts directory!');
}

captureGameplayDepth().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
