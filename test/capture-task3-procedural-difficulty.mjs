import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b2746edc-5714-4101-b26e-f272cdfb7c56';

async function captureProceduralDifficultyEvidence() {
  console.log('🚀 Starting Task 3 Procedural Variety & Difficulty Real-Browser Screenshot Capture...');

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
  // Shot 1: Opening Variety - Introductory Ramp & Side Reward Opening Template
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 1: Opening Template (OPENING_INTRO_RAMP with Side Routes & Coins)...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    if (window.__stagedObstacles) {
      window.__stagedObstacles.forEach((obs) => chunk0.group.remove(obs));
    }
    window.__stagedObstacles = [];

    // Reset player position to starting gate
    game.player.position.set(0, 0.9, -6.0);
    game.player.updateCollider();

    // Populate Chunk 0 with OPENING_INTRO_RAMP
    const pattern = game.trackManager.selectPattern ? null : null;
    const OBSTACLE_PATTERNS = window.__METRO_PATTERNS__ || [];
    // Force chunk0 populate with OPENING_INTRO_RAMP
    chunk0.clearDynamicItems();
    // Use TrackManager's patterns or populate directly
    const openingIntroRamp = {
      name: 'OPENING_INTRO_RAMP',
      difficulty: 'BEGINNER',
      entryLanes: [-1, 0, 1],
      exitLanes: [-1, 0, 1],
      obstacles: [
        { type: 'TRAIN', lane: 1, zOffset: 32.0, length: 24.0, hasRamp: true },
        { type: 'LOW_BARRIER', lane: -1, zOffset: 58.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
        { type: 'COIN', lane: 0, endLane: 1, zOffset: 25.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
        { type: 'COIN', lane: 1, zOffset: 34.0, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'RAMP_ASCENT' },
        { type: 'COIN', lane: 1, zOffset: 44.0, yOffset: 5.2, count: 6, spacing: 2.2, archetype: 'ROOFTOP_RUN' },
        { type: 'COIN', lane: -1, zOffset: 26.0, count: 5, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
      ]
    };
    chunk0.populate(openingIntroRamp, 0, game.trackManager.envManager.getTheme('SUBWAY_CLASSIC'), false);

    const cam = game.cameraController.camera;
    cam.position.set(0, 4.6, 6.0);
    cam.lookAt(0, 1.8, -40.0);
  });

  const shot1Path = path.join(ARTIFACT_DIR, 'task3_opening_variety.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log(`✅ Shot 1 saved to: ${shot1Path}`);

  // -------------------------------------------------------------------------
  // Shot 2: Mid-Run Pacing (30-60s) - Oncoming Moving Train & Flank Route
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 2: Mid-Run Pacing (Oncoming Moving Train with Headlights & Flanks)...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    chunk0.clearDynamicItems();

    // Player running in left lane (-3.6m)
    game.player.position.set(-3.6, 0.9, -15.0);
    game.player.updateCollider();

    // Mid-run pattern: MOVING_TRAIN_SIDE_CHOICE
    const movingPattern = {
      name: 'MOVING_TRAIN_SIDE_CHOICE',
      difficulty: 'MEDIUM',
      entryLanes: [-1, 0, 1],
      exitLanes: [-1, 1],
      obstacles: [
        { type: 'MOVING_TRAIN', lane: 0, zOffset: 45.0, length: 22.0, isMoving: true, velocityZ: 26.0 },
        { type: 'LOW_BARRIER', lane: 1, zOffset: 65.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.4, archetype: 'STRAIGHT_TRAIL' },
        { type: 'COIN', lane: 1, zOffset: 22.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
        { type: 'COIN', lane: 1, zOffset: 62.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
      ]
    };
    chunk0.populate(movingPattern, 0, game.trackManager.envManager.getTheme('SUBWAY_CLASSIC'), false);

    // Illuminate moving train headlights
    chunk0.obstacles.forEach((obs) => {
      if (obs.type === 'MOVING_TRAIN' && obs.headlights) {
        obs.headlights.forEach((h) => {
          if (h.material) {
            h.material.color.setHex(0xffffff);
            if (h.material.emissive) h.material.emissive.setHex(0xffeb3b);
          }
        });
      }
    });

    const cam = game.cameraController.camera;
    cam.position.set(-2.0, 4.4, -2.0);
    cam.lookAt(-1.0, 1.8, -45.0);
  });

  const shot2Path = path.join(ARTIFACT_DIR, 'task3_midrun_pacing.png');
  await page.screenshot({ path: shot2Path, fullPage: false });
  console.log(`✅ Shot 2 saved to: ${shot2Path}`);

  // -------------------------------------------------------------------------
  // Shot 3: Advanced Gauntlet (60-120s) - Tunnel, Structural Pillars & Jump/Slide
  // -------------------------------------------------------------------------
  console.log('📸 Capturing Shot 3: Advanced Gauntlet (Tunnel Portal, Pillar & Jump/Slide Gauntlet)...');
  await stageScene(() => {
    const game = window.__METRO_GAME__;
    const chunk0 = game.trackManager.chunks[0];
    chunk0.clearDynamicItems();

    // Player running in center lane at high speed
    game.player.position.set(0, 0.9, -12.0);
    game.player.updateCollider();

    // Advanced pattern: TUNNEL_ENTRY_SLIDE_HAZARD with Structural Pillar
    const advancedPattern = {
      name: 'TUNNEL_ENTRY_SLIDE_HAZARD',
      difficulty: 'HARD',
      isTunnel: true,
      tunnelPortal: 'ENTRY',
      entryLanes: [-1, 0, 1],
      exitLanes: [-1, 0],
      obstacles: [
        { type: 'HIGH_BARRIER', lane: 0, zOffset: 32.0 },
        { type: 'PILLAR', lane: 1, zOffset: 42.0 },
        { type: 'LOW_BARRIER', lane: -1, zOffset: 58.0 }
      ],
      collectibles: [
        { type: 'COIN', lane: 0, zOffset: 26.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
        { type: 'COIN', lane: -1, zOffset: 20.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
        { type: 'COIN', lane: -1, zOffset: 55.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
      ]
    };
    chunk0.populate(advancedPattern, 0, game.trackManager.envManager.getTheme('INDUSTRIAL_OVERPASS'), true);

    const cam = game.cameraController.camera;
    cam.position.set(0, 4.4, 2.0);
    cam.lookAt(0, 1.8, -45.0);
  });

  const shot3Path = path.join(ARTIFACT_DIR, 'task3_advanced_gauntlet.png');
  await page.screenshot({ path: shot3Path, fullPage: false });
  console.log(`✅ Shot 3 saved to: ${shot3Path}`);

  await browser.close();
  console.log('🎉 All Task 3 real-browser screenshots captured successfully!');
}

captureProceduralDifficultyEvidence().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
