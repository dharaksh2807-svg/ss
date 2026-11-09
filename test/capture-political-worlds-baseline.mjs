import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/e73cdf04-6547-4661-b725-4f23c723880f/evidence';
const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'baseline-captures');

fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });

function saveScreenshot(buffer, filename) {
  const pBrain = path.join(BRAIN_ARTIFACT_DIR, filename);
  const pLocal = path.join(LOCAL_ARTIFACT_DIR, filename);
  fs.writeFileSync(pBrain, buffer);
  fs.writeFileSync(pLocal, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

const WORLDS = [
  {
    id: 'VIP_EXPRESS',
    name: 'VIP Express (Mitron Express)',
    charId: 'char_modi',
    skinId: 'modi_classic',
    districts: [
      {
        idx: 0,
        zDist: 0,
        id: 'vip_d0_roadshow_royale',
        name: 'Roadshow Royale (The Grand Motorcade)',
        gagName: 'Bulletproof Motorcade Petal Cannons & Lotus Rostrum',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.5, y: 5.5, zOffset: -15, lookX: 0, lookY: 2.0, lookZOffset: -38 },
        gagCam: { x: -8.0, y: 3.8, zOffset: -28, lookX: -12.5, lookY: 3.0, lookZOffset: -36 }
      },
      {
        idx: 1,
        zDist: 400,
        id: 'vip_d1_chai_pe_charcha',
        name: 'Chai Pe Charcha Chaos (Mega Summit)',
        gagName: 'Colossal Brass Kettle Pour & Monumental Teacup Unveiling',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.0, y: 5.0, zOffset: -12, lookX: 0, lookY: 2.0, lookZOffset: -38 },
        gagCam: { x: -7.5, y: 3.0, zOffset: -30, lookX: -15.0, lookY: 2.5, lookZOffset: -45 }
      },
      {
        idx: 2,
        zDist: 800,
        id: 'vip_d2_inauguration_infinity',
        name: 'Inauguration Infinity (The Ribbon Cut)',
        gagName: 'Recursive Golden Scissors & Digital Inauguration Remote',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.0, y: 5.2, zOffset: -12, lookX: 0, lookY: 2.0, lookZOffset: -38 },
        gagCam: { x: -9.0, y: 3.5, zOffset: -25, lookX: -16.0, lookY: 3.0, lookZOffset: -38 }
      },
      {
        idx: 3,
        zDist: 1200,
        id: 'vip_d3_breaking_news',
        name: 'Breaking News Boulevard (Prime-Time Circus)',
        gagName: 'Media Conga Line & Microphone Showdown',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.5, y: 6.0, zOffset: -15, lookX: 0, lookY: 3.0, lookZOffset: -40 },
        gagCam: { x: -5.0, y: 4.5, zOffset: -35, lookX: 6.0, lookY: 4.0, lookZOffset: -45 }
      },
      {
        idx: 4,
        zDist: 1600,
        id: 'vip_d4_parliament_mayhem',
        name: 'Parliament Mayhem (Opposition Showdown)',
        gagName: 'Legislative Paper Vortex & Colossal Wooden Gavel Thump',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.5, y: 5.2, zOffset: -12, lookX: 0, lookY: 2.5, lookZOffset: -38 },
        gagCam: { x: -8.0, y: 4.0, zOffset: -30, lookX: -15.0, lookY: 3.0, lookZOffset: -45 }
      },
      {
        idx: 5,
        zDist: 2000,
        id: 'vip_d5_masterstroke_megacity',
        name: 'Masterstroke Megacity (Coalition Carousel)',
        gagName: 'Masterstroke Machine Gear-Stamper & Coalition Swivel Chairs',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.0, y: 5.5, zOffset: -12, lookX: 0, lookY: 3.0, lookZOffset: -40 },
        gagCam: { x: -7.5, y: 4.5, zOffset: -30, lookX: -15.5, lookY: 4.0, lookZOffset: -45 }
      }
    ]
  },
  {
    id: 'RAHULVERSE',
    name: 'Rahulverse (The Never-Ending Yatra)',
    charId: 'char_rahul_gandhi',
    skinId: 'rahul_classic',
    districts: [
      {
        idx: 0,
        zDist: 0,
        id: 'rahul_d0_infinite_yatra',
        name: 'The Infinite Yatra (Monumental Finish Flip)',
        gagName: 'Finish Line Flip Arch & Golden Sneaker Monument',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.5, y: 5.5, zOffset: -12, lookX: 0, lookY: 2.0, lookZOffset: -38 },
        gagCam: { x: 0, y: 4.5, zOffset: -22, lookX: 0, lookY: 6.0, lookZOffset: -38 }
      },
      {
        idx: 1,
        zDist: 400,
        id: 'rahul_d1_parliament_pandemonium',
        name: 'Parliament Pandemonium (Parliament.exe Glitch)',
        gagName: 'Runaway Robotic Mic Keep-Away & Flying Bills Storm',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.5, y: 5.5, zOffset: -12, lookX: 0, lookY: 2.5, lookZOffset: -38 },
        gagCam: { x: -8.0, y: 3.5, zOffset: -28, lookX: -15.0, lookY: 3.0, lookZOffset: -40 }
      },
      {
        idx: 2,
        zDist: 800,
        id: 'rahul_d2_press_conference_panic',
        name: 'Press Conference Panic (Labyrinth of Mics)',
        gagName: 'Anchor Furious Cross-Examination of Empty Chair',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.0, y: 5.5, zOffset: -12, lookX: 0, lookY: 3.0, lookZOffset: -40 },
        gagCam: { x: -8.0, y: 3.2, zOffset: -26, lookX: -14.5, lookY: 2.8, lookZOffset: -38 }
      },
      {
        idx: 3,
        zDist: 1200,
        id: 'rahul_d3_alliance_rollercoaster',
        name: 'The Great Alliance Amusement Park (Coalition Clashing)',
        gagName: 'Middle-Seat Musical Chairs & Mismatched Puzzle Pieces',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.0, y: 5.8, zOffset: -12, lookX: 0, lookY: 2.8, lookZOffset: -40 },
        gagCam: { x: -7.5, y: 3.5, zOffset: -28, lookX: -14.0, lookY: 3.0, lookZOffset: -42 }
      },
      {
        idx: 4,
        zDist: 1600,
        id: 'rahul_d4_political_multiverse',
        name: 'The Political Multiverse Glitch (Rival Portal Swap)',
        gagName: 'Swirling Multiverse Portals & Cosmic Mic Rocket Launch',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -8.0, y: 5.5, zOffset: -12, lookX: 0, lookY: 3.0, lookZOffset: -40 },
        gagCam: { x: 0, y: 4.0, zOffset: -25, lookX: 0, lookY: 4.5, lookZOffset: -45 }
      },
      {
        idx: 5,
        zDist: 2000,
        id: 'rahul_d5_regional_roadshow',
        name: 'Regional Town and Roadshow (Grassroots Satire)',
        gagName: 'Loudspeaker Tractor Rally & Vernacular Party Offices',
        camRunner: { x: 0, y: 3.2, zOffset: 6.2 },
        camThreeQuarter: { x: -7.5, y: 5.5, zOffset: -12, lookX: 0, lookY: 2.5, lookZOffset: -38 },
        gagCam: { x: -8.5, y: 3.8, zOffset: -28, lookX: -15.0, lookY: 3.2, lookZOffset: -42 }
      }
    ]
  }
];

async function main() {
  console.log('🚀 Launching Google Chrome for Metro Runner 3D Political Worlds Baseline Forensics...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine confirmed.');

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const telemetryReport = {
    timestamp: new Date().toISOString(),
    baselineCommit: 'bb125faeb9f10c7cc2c66cc9b8f8055e3e81a644',
    browser: 'Google Chrome (macOS, Angle WebGL)',
    smokeTests: {},
    districts: {}
  };

  // =========================================================================
  // STEP 1: REAL GAMEPLAY SMOKE TESTS (WITHOUT COLLISION BYPASSES)
  // =========================================================================
  console.log('\n=======================================================');
  console.log('🛡️ STEP 1: REAL GAMEPLAY SMOKE TESTS (COLLISIONS ENABLED)');
  console.log('=======================================================');

  for (const world of WORLDS) {
    console.log(`\nTesting Real Collision Gameplay in ${world.name}...`);
    await page.setViewportSize({ width: 1440, height: 900 });

    const smokeResult = await page.evaluate(async (w) => {
      const game = window.__METRO_GAME__;

      // Unlock & equip character
      game.progression.unlockCharacter(w.charId);
      game.progression.equipCharacter(w.charId, w.skinId);
      game.player.applyCharacter(w.charId, w.skinId);

      // Equip world theme
      const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
      const theme = EnvironmentRegistry.getInstance().get(w.id);
      game.trackManager.setEnvironment(w.id);
      game.worldScene.applyEnvironment(theme);

      // Start run with NORMAL physics and NO collision bypasses
      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      // CRITICAL: Ensure NO invincibility or grace bypasses are active
      game.player.isIntroInvincible = false;
      game.player.activateReviveGrace(0);

      const initialZ = game.player.position.z;

      // Step 1A: Let player run for 150 frames (~2.5s) without crashing
      let frames = 0;
      let crashedAtFrame = -1;
      await new Promise((resolve) => {
        function stepRun() {
          frames++;
          if (game.player.state === 'CRASH' || game.lifecycleState === 'GAMEOVER' || game.lifecycleState === 'DYING') {
            crashedAtFrame = frames;
            resolve();
            return;
          }
          if (frames >= 150) {
            resolve();
            return;
          }
          requestAnimationFrame(stepRun);
        }
        requestAnimationFrame(stepRun);
      });

      const midZ = game.player.position.z;
      const initialDistance = Math.abs(midZ - initialZ);
      const isAliveMid = (crashedAtFrame === -1);

      return {
        worldId: w.id,
        initialZ,
        midZ,
        initialDistance,
        framesAlive: frames,
        isAliveMid,
        playerSpeed: game.player.speed,
        activeObstaclesCount: game.trackManager.getChunks().reduce((acc, c) => acc + c.obstacles.length, 0),
        activeTrainsCount: game.trackManager.getChunks().reduce((acc, c) => acc + (c.trains ? c.trains.length : 0), 0)
      };
    }, world);

    console.log(`  Initial Run: Traveled ${smokeResult.initialDistance.toFixed(1)}m in ${smokeResult.framesAlive} frames. Alive = ${smokeResult.isAliveMid}`);
    console.log(`  Active Obstacles: ${smokeResult.activeObstaclesCount}, Active Trains: ${smokeResult.activeTrainsCount}`);

    // Take active gameplay snapshot
    let smokeBuf = await page.screenshot();
    const smokeFile = `${world.id.toLowerCase()}_smoke_active_gameplay.png`;
    saveScreenshot(smokeBuf, smokeFile);
    smokeResult.screenshot = smokeFile;

    // Step 1B: Continue running straight down track until player hits an obstacle/train naturally
    const collisionTest = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const startZ = game.player.position.z;
      let collisionFrames = 0;
      let collisionImpact = false;

      await new Promise((resolve) => {
        function checkCollision() {
          collisionFrames++;
          if (game.player.state === 'CRASH' || game.lifecycleState === 'GAMEOVER' || game.lifecycleState === 'DYING') {
            collisionImpact = true;
            resolve();
            return;
          }
          if (collisionFrames >= 400) { // Up to ~6.5 seconds
            resolve();
            return;
          }
          requestAnimationFrame(checkCollision);
        }
        requestAnimationFrame(checkCollision);
      });

      return {
        collisionImpact,
        collisionFrames,
        impactZ: game.player.position.z,
        totalDistance: Math.abs(game.player.position.z),
        playerState: game.player.state,
        lifecycleState: game.lifecycleState
      };
    });

    console.log(`  Natural Collision Impact: Impact = ${collisionTest.collisionImpact} at distance ${collisionTest.totalDistance.toFixed(1)}m (PlayerState: ${collisionTest.playerState}, Lifecycle: ${collisionTest.lifecycleState})`);
    let collBuf = await page.screenshot();
    const collFile = `${world.id.toLowerCase()}_smoke_collision_response.png`;
    saveScreenshot(collBuf, collFile);

    smokeResult.collisionResponse = { ...collisionTest, screenshot: collFile };
    telemetryReport.smokeTests[world.id] = smokeResult;
  }

  // =========================================================================
  // STEP 2: DISTRICT AUDIT FORENSICS & CAPTURES (ALL 12 DISTRICTS)
  // =========================================================================
  console.log('\n=======================================================');
  console.log('🏛️ STEP 2: DISTRICT AUDIT FORENSICS (12 DISTRICTS)');
  console.log('=======================================================');

  for (const world of WORLDS) {
    console.log(`\n>>> Auditing Theme: ${world.name} [${world.id}] <<<`);

    for (const dist of world.districts) {
      console.log(`\n-------------------------------------------------------`);
      console.log(`District ${dist.idx}: ${dist.name} (Canonical ~${dist.zDist}m)`);
      console.log(`Flagship Gag: ${dist.gagName}`);
      console.log(`-------------------------------------------------------`);

      // 1. Setup district scene deterministically
      await page.setViewportSize({ width: 1440, height: 900 });

      const distMetrics = await page.evaluate(async ({ w, d }) => {
        const game = window.__METRO_GAME__;

        // Equip character and world
        game.progression.unlockCharacter(w.charId);
        game.progression.equipCharacter(w.charId, w.skinId);
        game.player.applyCharacter(w.charId, w.skinId);

        const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
        const theme = EnvironmentRegistry.getInstance().get(w.id);
        game.trackManager.setEnvironment(w.id);
        game.worldScene.applyEnvironment(theme);

        // Start game
        game.startRun('NORMAL');
        if (game.openingSequence) {
          game.openingSequence.skip();
        }

        // Set stable speed and position player at z = -d.zDist
        game.player.speed = 16.0;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;

        // Rebuild first chunk with exact district index
        const chunks = game.trackManager.getChunks();
        const targetChunk = chunks[0];
        targetChunk.group.position.set(0, 0, 0);

        // Clear existing decorative group
        while (targetChunk.decorativeGroup.children.length > 0) {
          targetChunk.decorativeGroup.remove(targetChunk.decorativeGroup.children[0]);
        }

        if (w.id === 'VIP_EXPRESS') {
          const { VipSatireWorldBuilder } = await import('./src/environment/VipSatireWorldBuilder.js');
          const builder = VipSatireWorldBuilder.getInstance();
          builder.buildDistrictScenery(targetChunk.decorativeGroup, 12, 100, d.idx, 'FULL', -d.zDist);
        } else {
          const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
          const builder = RahulSatireWorldBuilder.getInstance();
          builder.buildDistrictScenery(targetChunk.decorativeGroup, 12, 100, d.idx, 'FULL', -d.zDist);
        }

        // Collect WebGL render statistics
        const renderer = game.worldScene.renderer;
        const info = renderer.info;

        // Count objects, meshes, materials
        let meshCount = 0;
        let blackSlabCount = 0;

        targetChunk.decorativeGroup.traverse((obj) => {
          if (obj.isMesh) {
            meshCount++;
            if (obj.material) {
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach(m => {
                if (m.color && m.color.getHex() === 0x000000 && !m.map) {
                  blackSlabCount++;
                }
              });
            }
          }
        });

        // Sample FPS & Draw Calls over 60 frames
        const fpsSamples = [];
        const drawCalls = [];
        const triangles = [];

        await new Promise((resolve) => {
          let f = 0;
          let last = performance.now();
          function sampleLoop() {
            const now = performance.now();
            const delta = now - last;
            last = now;
            if (f > 0) {
              fpsSamples.push(1000 / Math.max(1, delta));
              drawCalls.push(info.render.calls);
              triangles.push(info.render.triangles);
            }
            f++;
            if (f < 60) {
              requestAnimationFrame(sampleLoop);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(sampleLoop);
        });

        fpsSamples.sort((a, b) => a - b);
        drawCalls.sort((a, b) => a - b);
        triangles.sort((a, b) => a - b);

        const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / (fpsSamples.length || 1);
        const minFps = fpsSamples[0] || 60;
        const avgDrawCalls = drawCalls.reduce((a, b) => a + b, 0) / (drawCalls.length || 1);
        const maxDrawCalls = drawCalls[drawCalls.length - 1] || 0;
        const avgTriangles = triangles.reduce((a, b) => a + b, 0) / (triangles.length || 1);
        const maxTriangles = triangles[triangles.length - 1] || 0;

        return {
          meshCount,
          blackSlabCount,
          avgFps: Math.round(avgFps),
          minFps: Math.round(minFps),
          avgDrawCalls: Math.round(avgDrawCalls),
          maxDrawCalls,
          avgTriangles: Math.round(avgTriangles),
          maxTriangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures
        };
      }, { w: world, d: dist });

      console.log(`  Metrics: DrawCalls=${distMetrics.avgDrawCalls}, Triangles=${distMetrics.avgTriangles}, FPS=${distMetrics.avgFps}, Meshes=${distMetrics.meshCount}, BlackSlabs=${distMetrics.blackSlabCount}`);

      // CAPTURE A: Ordinary third-person runner camera at active gameplay speed (1440x900)
      console.log('  Capturing (A) Third-Person Runner View...');
      await page.evaluate(({ d }) => {
        const game = window.__METRO_GAME__;
        game.player.position.set(0, 0, -20);
        game.player.mesh.position.set(0, 0, -20);
        game.player.mesh.rotation.y = 0;
        game.player.model.setPresentationPose('RUN');
        game.player.model.update(0.016, 16.0, true, false, false, false, false);

        // Standard third-person runner gameplay camera behind character
        game.cameraController.camera.position.set(0, 2.8, -20 + d.camRunner.zOffset);
        game.cameraController.camera.lookAt(0, 1.8, -20 - 35.0);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
      }, { d: dist });
      await page.waitForTimeout(300);
      let buf = await page.screenshot();
      const fnRunner = `${dist.id}_01_runner.png`;
      saveScreenshot(buf, fnRunner);

      // CAPTURE B: Three-quarter environment review image (1440x900)
      console.log('  Capturing (B) Three-Quarter Environment Review View...');
      await page.evaluate(({ d }) => {
        const game = window.__METRO_GAME__;
        const cam = game.cameraController.camera;
        cam.position.set(d.camThreeQuarter.x, d.camThreeQuarter.y, -20 + d.camThreeQuarter.zOffset);
        cam.lookAt(d.camThreeQuarter.lookX, d.camThreeQuarter.lookY, -20 + d.camThreeQuarter.lookZOffset);
        game.worldScene.renderer.render(game.worldScene.scene, cam);
      }, { d: dist });
      await page.waitForTimeout(300);
      buf = await page.screenshot();
      const fnThreeQuarter = `${dist.id}_02_three_quarter.png`;
      saveScreenshot(buf, fnThreeQuarter);

      // CAPTURE C: Mobile view at 390x844 (Portrait iPhone 14)
      console.log('  Capturing (C) Mobile Portrait View (390x844)...');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.worldScene.renderer.setSize(390, 844);
        game.cameraController.camera.aspect = 390 / 844;
        game.cameraController.camera.updateProjectionMatrix();

        // Runner camera for mobile
        game.cameraController.camera.position.set(0, 3.2, -20 + 7.0);
        game.cameraController.camera.lookAt(0, 2.0, -20 - 32.0);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
      });
      await page.waitForTimeout(300);
      buf = await page.screenshot();
      const fnMobile = `${dist.id}_03_mobile_390x844.png`;
      saveScreenshot(buf, fnMobile);

      // Reset to Desktop 1440x900 for animation captures
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.worldScene.renderer.setSize(1440, 900);
        game.cameraController.camera.aspect = 1440 / 900;
        game.cameraController.camera.updateProjectionMatrix();
      });

      // CAPTURE D: Main Comedy Animation (Before / Middle / After frames)
      console.log(`  Capturing (D) Comedy Gag Keyframes [${dist.gagName}]...`);

      // 1. Frame: BEFORE (t=0.0s / Anticipation)
      await page.evaluate(async ({ w, d }) => {
        const game = window.__METRO_GAME__;
        const cam = game.cameraController.camera;
        cam.position.set(d.gagCam.x, d.gagCam.y, -20 + d.gagCam.zOffset);
        cam.lookAt(d.gagCam.lookX, d.gagCam.lookY, -20 + d.gagCam.lookZOffset);

        if (w.id === 'VIP_EXPRESS') {
          const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
          VipComedyEventDirector.getInstance().update(0.001, true, -d.zDist);
        } else {
          const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
          RahulComedyEventDirector.getInstance().update(0.001, true, -d.zDist);
        }
        game.worldScene.renderer.render(game.worldScene.scene, cam);
      }, { w: world, d: dist });
      await page.waitForTimeout(200);
      buf = await page.screenshot();
      const fnGagBefore = `${dist.id}_04_anim_before.png`;
      saveScreenshot(buf, fnGagBefore);

      // 2. Frame: MIDDLE (t=1.0s / Peak Climax / Comic Shock)
      await page.evaluate(async ({ w, d }) => {
        const game = window.__METRO_GAME__;
        const cam = game.cameraController.camera;
        cam.position.set(d.gagCam.x, d.gagCam.y, -20 + d.gagCam.zOffset);
        cam.lookAt(d.gagCam.lookX, d.gagCam.lookY, -20 + d.gagCam.lookZOffset);

        if (w.id === 'VIP_EXPRESS') {
          const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
          VipComedyEventDirector.getInstance().update(1.0, true, -d.zDist);
        } else {
          const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
          RahulComedyEventDirector.getInstance().update(1.0, true, -d.zDist);
        }
        game.worldScene.renderer.render(game.worldScene.scene, cam);
      }, { w: world, d: dist });
      await page.waitForTimeout(200);
      buf = await page.screenshot();
      const fnGagMid = `${dist.id}_05_anim_mid.png`;
      saveScreenshot(buf, fnGagMid);

      // 3. Frame: AFTER (t=2.5s / Payoff / Recovery / Loop)
      await page.evaluate(async ({ w, d }) => {
        const game = window.__METRO_GAME__;
        const cam = game.cameraController.camera;
        cam.position.set(d.gagCam.x, d.gagCam.y, -20 + d.gagCam.zOffset);
        cam.lookAt(d.gagCam.lookX, d.gagCam.lookY, -20 + d.gagCam.lookZOffset);

        if (w.id === 'VIP_EXPRESS') {
          const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
          VipComedyEventDirector.getInstance().update(1.5, true, -d.zDist);
        } else {
          const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
          RahulComedyEventDirector.getInstance().update(1.5, true, -d.zDist);
        }
        game.worldScene.renderer.render(game.worldScene.scene, cam);
      }, { w: world, d: dist });
      await page.waitForTimeout(200);
      buf = await page.screenshot();
      const fnGagAfter = `${dist.id}_06_anim_after.png`;
      saveScreenshot(buf, fnGagAfter);

      telemetryReport.districts[dist.id] = {
        ...distMetrics,
        name: dist.name,
        worldId: world.id,
        zDist: dist.zDist,
        gagName: dist.gagName,
        captures: {
          runner: fnRunner,
          threeQuarter: fnThreeQuarter,
          mobile: fnMobile,
          animBefore: fnGagBefore,
          animMid: fnGagMid,
          animAfter: fnGagAfter
        }
      };
    }
  }

  // Save full JSON telemetry
  const telemetryPath = path.join(LOCAL_ARTIFACT_DIR, 'telemetry_report.json');
  fs.writeFileSync(telemetryPath, JSON.stringify(telemetryReport, null, 2));
  fs.writeFileSync(path.join(BRAIN_ARTIFACT_DIR, 'telemetry_report.json'), JSON.stringify(telemetryReport, null, 2));
  console.log(`\n✅ Forensic Telemetry Report written to: ${telemetryPath}`);

  await browser.close();
  console.log('🏁 All baseline captures and forensic audits completed successfully!');
}

main().catch((err) => {
  console.error('❌ Baseline capture failed:', err);
  process.exit(1);
});
