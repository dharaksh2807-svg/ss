import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Output directories: project-local ignored directory and conversation brain artifact directory
const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'audit');
const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots/audit';

fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });

function saveScreenshotSync(buffer, filename) {
  const localPath = path.join(LOCAL_ARTIFACT_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(brainPath, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

const WORLDS = [
  { id: 'VIP_EXPRESS', name: 'Mitron Express: The Great Inauguration', charId: 'char_modi', skinId: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: The Never-Ending Yatra', charId: 'char_rahul_gandhi', skinId: 'rahul_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet: After Dark' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom: The Clockwork Empire' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express: Rails Through Hellfire' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush: The Lost World Railway' },
  { id: 'VIVA_HEAT', name: 'Viva Heat: The Forbidden Festival', isExperimental: true }
];

async function runAudit() {
  console.log('🚀 Launching Google Chrome for Complete Premium World Quality Audit...');
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
  console.log('🎮 Metro Runner engine detected on window.__METRO_GAME__\n');

  const auditTelemetry = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      browser: 'Google Chrome (Playwright Angle WebGL)',
      viewportDesktop: { width: 1440, height: 900 },
      viewportMobile: { width: 390, height: 844 }
    },
    worlds: {}
  };

  // Mute audio during audit
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  for (const world of WORLDS) {
    console.log(`\n=======================================================`);
    console.log(`🔍 AUDITING: ${world.name} [${world.id}]`);
    console.log(`=======================================================`);

    auditTelemetry.worlds[world.id] = {
      name: world.name,
      metricsHigh: null,
      metricsLow: null,
      eventDirectorCounts: {},
      observations: []
    };

    // Set viewport to Desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // Apply environment & character using authentic game progression API
    await page.evaluate(async (w) => {
      const game = window.__METRO_GAME__;

      if (w.isExperimental) {
        if (window.__DEV_SET_WORLD__) {
          window.__DEV_SET_WORLD__(w.id);
        }
      } else if (w.charId) {
        game.progression.unlockCharacter(w.charId);
        game.progression.equipCharacter(w.charId, w.skinId);
        game.player.applyCharacter(w.charId, w.skinId);
      } else {
        game.progression.addCoins(100000);
        game.progression.purchaseTheme(w.id);
        game.progression.equipTheme(w.id);
      }

      // Start run in normal mode
      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      // Invincible for testing
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      // Set graphics preset to HIGH
      if (window.__GRAPHICS_MANAGER__) {
        window.__GRAPHICS_MANAGER__.setPreset('HIGH');
      }
    }, world);

    await page.waitForTimeout(600);

    // 1. Capture Normal Behind-Runner View (Desktop Gameplay)
    console.log('📸 1. Capturing Normal Behind-Runner View (Active Gameplay)...');
    let buffer = await page.screenshot();
    saveScreenshotSync(buffer, `${world.id.toLowerCase()}_01_normal_behind_runner.png`);

    // 2. Capture Forward Obstacle & Telegraphing Readability View
    console.log('📸 2. Capturing Forward Obstacle & Track Readability View...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      // Closer, lower forward gaze down the rail corridor
      cam.position.set(0, 1.8, game.player.position.z + 1.2);
      cam.lookAt(0, 1.5, game.player.position.z - 45.0);
      game.worldScene.renderer.render(game.worldScene.scene, cam);
    });
    buffer = await page.screenshot();
    saveScreenshotSync(buffer, `${world.id.toLowerCase()}_02_obstacle_readability.png`);

    // Restore camera tracking
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
    });

    // 3. Capture Three-Quarter Cinematic Scenery & Silhouette View
    console.log('📸 3. Capturing Three-Quarter Cinematic Scenery View...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      // High three-quarter side vantage point
      cam.position.set(-6.5, 5.0, game.player.position.z + 3.0);
      cam.lookAt(4.0, 6.0, game.player.position.z - 35.0);
      game.worldScene.renderer.render(game.worldScene.scene, cam);
    });
    buffer = await page.screenshot();
    saveScreenshotSync(buffer, `${world.id.toLowerCase()}_03_scenery_three_quarter.png`);

    // 4. Mobile Viewport (Portrait 390x844 - iPhone 14)
    console.log('📸 4. Capturing Mobile Viewport (Portrait 390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.setSize(390, 844);
      game.cameraController.camera.aspect = 390 / 844;
      game.cameraController.camera.updateProjectionMatrix();
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    });
    buffer = await page.screenshot();
    saveScreenshotSync(buffer, `${world.id.toLowerCase()}_04_mobile_viewport.png`);

    // Reset viewport back to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(1440, 900);
      game.cameraController.camera.aspect = 1440 / 900;
      game.cameraController.camera.updateProjectionMatrix();
    });

    // 5. Active Running Telemetry & Multi-District Sampling (90 real RAF frames)
    console.log('⚡ 5. Sampling Real-Time Running Telemetry (Graphics HIGH)...');
    const telemetryHigh = await page.evaluate(async (w) => {
      const game = window.__METRO_GAME__;
      const renderer = game.worldScene.renderer;
      const fpsSamples = [];
      const frameTimes = [];
      const drawCalls = [];
      const triangles = [];

      await new Promise((resolve) => {
        let frame = 0;
        let lastTime = performance.now();
        function sample() {
          const now = performance.now();
          const frameTime = now - lastTime;
          lastTime = now;
          if (frame > 0) { // discard first frame delta
            frameTimes.push(frameTime);
            fpsSamples.push(1000 / Math.max(1, frameTime));
            drawCalls.push(renderer.info.render.calls);
            triangles.push(renderer.info.render.triangles);
          }
          frame++;
          if (frame < 90) {
            requestAnimationFrame(sample);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(sample);
      });

      fpsSamples.sort((a, b) => a - b);
      frameTimes.sort((a, b) => a - b);
      drawCalls.sort((a, b) => a - b);
      triangles.sort((a, b) => a - b);

      const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / (fpsSamples.length || 1);
      const minFps = fpsSamples[0] || 60;
      const p1LowFps = fpsSamples[Math.floor(fpsSamples.length * 0.01)] || minFps;
      const avgDrawCalls = drawCalls.reduce((a, b) => a + b, 0) / (drawCalls.length || 1);
      const maxDrawCalls = drawCalls[drawCalls.length - 1] || 0;
      const avgTriangles = triangles.reduce((a, b) => a + b, 0) / (triangles.length || 1);
      const maxTriangles = triangles[triangles.length - 1] || 0;

      // Event director object counts read directly from bound window singletons
      let eventDirectorCounts = {};
      if (w.id === 'CHRONO_KINGDOM' && window.__CHRONO_DIRECTOR__) {
        const d = window.__CHRONO_DIRECTOR__;
        eventDirectorCounts = {
          gears: d.getGearCount(),
          chimes: d.getChimeCount(),
          bridges: d.getBridgeCount(),
          pistons: d.getPistonCount(),
          observatories: d.getObservatoryCount(),
          skybridgeTrains: d.getSkybridgeTrainCount(),
          portals: d.getTimePortalCount()
        };
      } else if (w.id === 'INFERNO_EXPRESS' && window.__INFERNO_DIRECTOR__) {
        const d = window.__INFERNO_DIRECTOR__;
        eventDirectorCounts = {
          volcanoes: d.getVolcanoCount(),
          waterfalls: d.getWaterfallCount(),
          chains: d.getChainCount(),
          geysers: d.getGeyserCount(),
          collapsingRocks: d.getCollapsingRockCount(),
          blastDoors: d.getBlastDoorCount()
        };
      } else if (w.id === 'JURASSIC_RUSH' && window.__JURASSIC_DIRECTOR__) {
        const d = window.__JURASSIC_DIRECTOR__;
        eventDirectorCounts = {
          sauropods: d.getSauropodCount(),
          carnivores: d.getCarnivoreCount(),
          raptors: d.getRaptorPackCount(),
          pterosaurs: d.getPterosaurCount(),
          herds: d.getHerbivoreHerdCount(),
          watchers: d.getCuriousWatcherCount()
        };
      } else if (w.id === 'VIVA_HEAT' && window.__FEVER_DIRECTOR__) {
        const d = window.__FEVER_DIRECTOR__;
        eventDirectorCounts = {
          flowers: d.getFlowerCount(),
          dancers: d.getDancerCount(),
          skybeams: d.getSkybeamCount(),
          yachts: d.getYachtCount(),
          sunLandmarks: d.getSunLandmarkCount()
        };
      } else if (w.id === 'VIP_EXPRESS' && window.__VIP_DIRECTOR__) {
        const d = window.__VIP_DIRECTOR__;
        eventDirectorCounts = {
          scissors: d.scissorsList?.length || 0,
          debaters: d.debatersList?.length || 0,
          steam: d.steamList?.length || 0,
          flashes: d.flashList?.length || 0,
          helicopters: d.helicopterList?.length || 0,
          gavels: d.gavelList?.length || 0
        };
      } else if (w.id === 'RAHULVERSE' && window.__RAHUL_DIRECTOR__) {
        const d = window.__RAHUL_DIRECTOR__;
        eventDirectorCounts = {
          flipBoards: d.flipBoards?.length || 0,
          runawayMics: d.runawayMics?.length || 0,
          flyingPapers: d.flyingPapers?.length || 0,
          revolvingDoors: d.revolvingDoors?.length || 0,
          middleSeatDisputes: d.middleSeatDisputes?.length || 0,
          multiversePortals: d.multiversePortals?.length || 0
        };
      } else if (w.id === 'MIDNIGHT_VELVET' && window.__MIDNIGHT_DIRECTOR__) {
        const d = window.__MIDNIGHT_DIRECTOR__;
        eventDirectorCounts = {
          motorcadeCars: d.motorcadeCars?.length || 0,
          partyDancers: d.partyDancers?.length || 0,
          searchlights: d.searchlights?.length || 0,
          marinaYachts: d.marinaYachts?.length || 0,
          hotelMarquees: d.hotelMarquees?.length || 0,
          clockTowers: d.clockTowers?.length || 0
        };
      }

      return {
        avgFps: Math.round(avgFps),
        p1LowFps: Math.round(p1LowFps),
        avgDrawCalls: Math.round(avgDrawCalls),
        maxDrawCalls,
        avgTriangles: Math.round(avgTriangles),
        maxTriangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        eventDirectorCounts,
        distanceTraveled: Math.round(game.player.distanceTraveled)
      };
    }, world);

    auditTelemetry.worlds[world.id].metricsHigh = telemetryHigh;
    auditTelemetry.worlds[world.id].eventDirectorCounts = telemetryHigh.eventDirectorCounts;

    console.log(`  📊 Telemetry (HIGH): Avg FPS: ${telemetryHigh.avgFps}, 1% Low: ${telemetryHigh.p1LowFps}, Calls: ${telemetryHigh.avgDrawCalls}, Triangles: ${telemetryHigh.avgTriangles.toLocaleString()}, Geos: ${telemetryHigh.geometries}`);
    console.log(`  🎪 Event Director Registered Objects:`, telemetryHigh.eventDirectorCounts);

    // 6. Test with LOW Graphics Preset
    console.log('⚡ 6. Sampling Telemetry (Graphics LOW)...');
    const telemetryLow = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      if (window.__GRAPHICS_MANAGER__) {
        window.__GRAPHICS_MANAGER__.setPreset('LOW');
      }
      const renderer = game.worldScene.renderer;

      const fpsSamples = [];
      const drawCalls = [];
      const triangles = [];

      await new Promise((resolve) => {
        let frame = 0;
        let lastTime = performance.now();
        function sample() {
          const now = performance.now();
          const frameTime = now - lastTime;
          lastTime = now;
          if (frame > 0) {
            fpsSamples.push(1000 / Math.max(1, frameTime));
            drawCalls.push(renderer.info.render.calls);
            triangles.push(renderer.info.render.triangles);
          }
          frame++;
          if (frame < 60) {
            requestAnimationFrame(sample);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(sample);
      });

      fpsSamples.sort((a, b) => a - b);
      return {
        avgFps: Math.round(fpsSamples.reduce((a, b) => a + b, 0) / (fpsSamples.length || 1)),
        p1LowFps: Math.round(fpsSamples[0] || 60),
        avgDrawCalls: Math.round(drawCalls.reduce((a, b) => a + b, 0) / (drawCalls.length || 1)),
        avgTriangles: Math.round(triangles.reduce((a, b) => a + b, 0) / (triangles.length || 1)),
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
      };
    });

    auditTelemetry.worlds[world.id].metricsLow = telemetryLow;
    console.log(`  📊 Telemetry (LOW): Avg FPS: ${telemetryLow.avgFps}, Calls: ${telemetryLow.avgDrawCalls}, Triangles: ${telemetryLow.avgTriangles.toLocaleString()}`);
  }

  // 7. World Switch & Memory Leak Audit
  console.log('\n=======================================================');
  console.log('🔄 AUDITING WORLD SWITCHING & CLEANUP');
  console.log('=======================================================');

  const switchAudit = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
    const registry = EnvironmentRegistry.getInstance();
    const renderer = game.worldScene.renderer;

    const sequence = ['MODERN_METRO', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH', 'MIDNIGHT_VELVET', 'RAHULVERSE', 'VIP_EXPRESS', 'MODERN_METRO'];
    const log = [];

    for (const envId of sequence) {
      const theme = registry.get(envId);
      game.trackManager.setEnvironment(envId);
      game.worldScene.applyEnvironment(theme);

      // Wait for 400ms for RAF loop to render chunks under new environment
      await new Promise((r) => setTimeout(r, 400));

      log.push({
        envId,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
      });
    }

    return log;
  });

  auditTelemetry.switchAudit = switchAudit;
  console.log('📊 Switch Memory Progression:');
  switchAudit.forEach((entry) => {
    console.log(`  - ${entry.envId.padEnd(18)}: Calls=${entry.drawCalls}, Tris=${entry.triangles.toLocaleString()}, Geos=${entry.geometries}, Texs=${entry.textures}`);
  });

  // Save Telemetry JSON
  const telemetryPath = path.join(LOCAL_ARTIFACT_DIR, 'audit_telemetry.json');
  fs.writeFileSync(telemetryPath, JSON.stringify(auditTelemetry, null, 2));
  fs.writeFileSync(path.join(BRAIN_ARTIFACT_DIR, 'audit_telemetry.json'), JSON.stringify(auditTelemetry, null, 2));
  console.log(`\n✅ Audit telemetry saved to: ${telemetryPath}`);

  await browser.close();
  console.log('🏁 Audit capture and performance profiling complete!');
}

runAudit().catch((err) => {
  console.error('❌ Audit failure:', err);
  process.exit(1);
});
