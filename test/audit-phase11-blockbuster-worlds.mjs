import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase11');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 11 Audit] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved: ${filename}`);
}

const ALL_WORLDS = [
  { id: 'MODERN_METRO', name: 'Modern Metro', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Railway Quarter', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Metro', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial Yard', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_RAINLINE', name: 'Neon Rainline Cyberpunk', charId: 'char_luna', skinId: 'luna_classic' },
  { id: 'ORBITAL_HALO', name: 'Orbital Halo Celestial Ring', charId: 'char_nova', skinId: 'nova_classic' },
  { id: 'ABYSSAL_GLASSLINE', name: 'Abyssal Glassline Deep Sea', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'DOOMSDAY_LAST_TRANSIT', name: 'Doomsday Last Transit', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'PHANTOM_LINE', name: 'Phantom Line Spectral Cemetery', charId: 'char_luna', skinId: 'luna_classic' },
  { id: 'HAUNTED_CARNIVAL', name: 'Haunted Carnival Fairgrounds', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'VIP_EXPRESS', name: 'Mitron Express: The Great Inauguration', charId: 'char_modi', skinId: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: The Never-Ending Yatra', charId: 'char_rahul_gandhi', skinId: 'rahul_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet Art Deco', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom Clockwork', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express Volcanic Bridge', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush Primeval Caldera', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'VIVA_HEAT', name: 'Viva Heat Sun-Drenched Street Carnival', charId: 'char_jax', skinId: 'jax_classic' }
];

async function runBlockbusterWorldQualityAudit() {
  log('======================================================================');
  log('🏰 PHASE 11: BLOCKBUSTER WORLD QUALITY AUDIT');
  log('   Independent AAA Technical Art, Visual Design & Performance Audit');
  log('======================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const fullAuditReport = {
    timestamp: new Date().toISOString(),
    engine: 'Three.js r128 / Vite / WebGL',
    totalWorldsAudited: ALL_WORLDS.length,
    worlds: {}
  };

  for (const w of ALL_WORLDS) {
    log(`----------------------------------------------------------------------`);
    log(`▶ Auditing [${w.id}] - ${w.name}`);
    log(`----------------------------------------------------------------------`);

    const worldData = {
      id: w.id,
      name: w.name,
      character: w.charId,
      checkpoints: {},
      presetTests: {},
      seedTests: {},
      mobileTest: {},
      frameTimeTelemetry: {},
      sceneIntegrity: {}
    };

    // Helper inside evaluate to setup world and teleport
    const setupWorldAtZ = async (targetZ, preset = 'HIGH', seed = 1337) => {
      return await page.evaluate(async ({ target, targetZ, preset, seed }) => {
        const game = window.__METRO_GAME__;
        const gm = window.__GRAPHICS_MANAGER__ || (await import('/src/scene/GraphicsManager.ts')).GraphicsManager.getInstance();

        // Set preset
        gm.setPreset(preset, true);

        // Unlock and equip character
        game.progression.unlockCharacter(target.charId);
        game.progression.equipCharacter(target.charId, target.skinId);
        game.player.applyCharacter(target.charId, target.skinId);

        // Unlock and equip theme
        game.progression.addCoins(100000);
        game.progression.purchaseTheme(target.id);
        game.progression.equipTheme(target.id);

        const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
        const theme = registry.get(target.id);
        game.worldScene.applyEnvironment(theme);

        // Reset track with specific seed
        game.trackManager.setDebugSeed(seed);
        game.trackManager.reset(false);

        // Start run with invulnerability
        game.startRun('NORMAL', false);
        game.cameraController.setLobbyMode(false);
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) game.openingSequence.skip();

        // Position player at targetZ
        game.player.distanceTraveled = targetZ;
        game.player.position.set(0, game.player.groundY, -targetZ);
        game.player.speed = 22.0;

        // Step simulation to populate chunks and scenery around player
        for (let s = 0; s < 30; s++) {
          game.trackManager.update(game.player, 0.05, s * 0.05);
          game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
          game.worldScene.updateAtmosphere(0.05);
        }

        // Orient player camera
        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        const rendererInfo = game.worldScene.renderer.info;
        return {
          drawCalls: rendererInfo.render.calls,
          triangles: rendererInfo.render.triangles,
          geometries: rendererInfo.memory.geometries,
          textures: rendererInfo.memory.textures,
          programs: rendererInfo.programs ? rendererInfo.programs.length : 0,
          currentQuality: gm.getResolvedQuality(),
          activePreset: gm.getPreset()
        };
      }, { target: w, targetZ, preset, seed });
    };

    // Helper to evaluate scene geometry & potential defects
    const inspectSceneObjects = async () => {
      return await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        let totalMeshes = 0;
        let instancedMeshes = 0;
        let totalInstances = 0;
        let blackBoxes = 0;
        let floatingObjects = 0;
        let groundMeshes = 0;
        let animatedActors = 0;
        let lightsCount = 0;

        game.worldScene.scene.traverse((obj) => {
          if (obj.isLight) lightsCount++;
          if (obj.isMesh) {
            totalMeshes++;
            if (obj.isInstancedMesh) {
              instancedMeshes++;
              totalInstances += obj.count;
            }
            if (obj.name && obj.name.toLowerCase().includes('ground')) {
              groundMeshes++;
            }
            if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
              const mat = obj.material;
              const isBlack = (mat && mat.color && mat.color.getHex() === 0x000000 && !mat.map);
              if (isBlack) blackBoxes++;
            }
            // Check floating non-ground structures far above ground with 0 collision
            const worldPos = new (window.THREE || obj.position.constructor)();
            obj.getWorldPosition(worldPos);
            if (worldPos.y > 15.0 && obj.parent === game.worldScene.scene) {
              floatingObjects++;
            }
          }
        });

        return {
          totalMeshes,
          instancedMeshes,
          totalInstances,
          blackBoxes,
          floatingObjects,
          groundMeshes,
          lightsCount
        };
      });
    };

    // 1. CHECKPOINT: Beginning (Z = -50m) in HIGH
    log('  Testing Checkpoint 1: Beginning (Z = -50m)...');
    const bgnStats = await setupWorldAtZ(50, 'HIGH', 1337);
    await page.waitForTimeout(200);
    const bgnFilename = `${w.id.toLowerCase()}_01_beginning_z50.png`;
    await saveScreenshot(page, bgnFilename);
    worldData.checkpoints.beginningZ50 = { ...bgnStats, screenshot: bgnFilename };

    // 2. CHECKPOINT: Mid-Run District (Z = -1000m) in HIGH
    log('  Testing Checkpoint 2: Mid-Run District (Z = -1000m)...');
    const midStats = await setupWorldAtZ(1000, 'HIGH', 1337);
    await page.waitForTimeout(200);
    const midFilename = `${w.id.toLowerCase()}_02_midrun_z1000.png`;
    await saveScreenshot(page, midFilename);
    const sceneAuditMid = await inspectSceneObjects();
    worldData.checkpoints.midrunZ1000 = { ...midStats, screenshot: midFilename };
    worldData.sceneIntegrity = sceneAuditMid;

    // 3. CHECKPOINT: Late-Game Run (Z = -2200m) in HIGH
    log('  Testing Checkpoint 3: Late-Game Traversal (Z = -2200m)...');
    const lateStats = await setupWorldAtZ(2200, 'HIGH', 1337);
    await page.waitForTimeout(200);
    const lateFilename = `${w.id.toLowerCase()}_03_late_z2200.png`;
    await saveScreenshot(page, lateFilename);
    worldData.checkpoints.lateZ2200 = { ...lateStats, screenshot: lateFilename };

    // 4. PRESET TEST: LOW at Z = -1000m (Examine scenery retention & culling)
    log('  Testing Preset LOW at Z = -1000m (Assessing scenery culling)...');
    const lowStats = await setupWorldAtZ(1000, 'LOW', 1337);
    await page.waitForTimeout(200);
    const lowFilename = `${w.id.toLowerCase()}_04_preset_low.png`;
    await saveScreenshot(page, lowFilename);
    const sceneAuditLow = await inspectSceneObjects();
    worldData.presetTests.low = {
      ...lowStats,
      screenshot: lowFilename,
      meshesRemaining: sceneAuditLow.totalMeshes,
      groundIntact: sceneAuditLow.groundMeshes > 0,
      reductionPct: (((midStats.triangles - lowStats.triangles) / (midStats.triangles || 1)) * 100).toFixed(1)
    };

    // 5. PRESET TEST: AUTO at Z = -1000m
    log('  Testing Preset AUTO at Z = -1000m...');
    const autoStats = await setupWorldAtZ(1000, 'AUTO', 1337);
    worldData.presetTests.auto = autoStats;

    // 6. SEED VARIATION TEST: Seed 7777 vs Seed 1337 at Z = -1000m
    log('  Testing Procedural Seed Variation (Seed 7777 at Z = -1000m)...');
    const seedStats = await setupWorldAtZ(1000, 'HIGH', 7777);
    await page.waitForTimeout(200);
    const seedFilename = `${w.id.toLowerCase()}_05_seed7777.png`;
    await saveScreenshot(page, seedFilename);
    worldData.seedTests.seed7777 = { ...seedStats, screenshot: seedFilename };

    // 7. MOBILE VIEWPORT TEST: 390x844 portrait at Z = -1000m
    log('  Testing Mobile Viewport (390x844 portrait)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(390, 844);
      game.cameraController.camera.aspect = 390 / 844;
      game.cameraController.camera.updateProjectionMatrix();
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    });
    await page.waitForTimeout(200);
    const mobileFilename = `${w.id.toLowerCase()}_06_mobile.png`;
    await saveScreenshot(page, mobileFilename);
    worldData.mobileTest = {
      viewport: '390x844',
      screenshot: mobileFilename
    };

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(1440, 900);
      game.cameraController.camera.aspect = 1440 / 900;
      game.cameraController.camera.updateProjectionMatrix();
    });

    // 8. FRAME TIME & TELEMETRY: 60 active ticks via requestAnimationFrame
    log('  Measuring frame time & performance telemetry...');
    const perfTelemetry = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const frameTimes = [];
        let count = 0;
        let last = performance.now();
        function frame() {
          const now = performance.now();
          if (count > 0) {
            frameTimes.push(now - last);
          }
          last = now;
          count++;
          if (count < 65) {
            requestAnimationFrame(frame);
          } else {
            frameTimes.sort((a, b) => a - b);
            const p50 = frameTimes[Math.floor(frameTimes.length * 0.50)] || 16.6;
            const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)] || 16.6;
            const p99 = frameTimes[Math.floor(frameTimes.length * 0.99)] || 16.6;
            const avg = frameTimes.reduce((acc, v) => acc + v, 0) / frameTimes.length;
            const fps = Math.round(1000 / (avg || 16.6));

            resolve({
              avgFrameTimeMs: +avg.toFixed(2),
              p50FrameTimeMs: +p50.toFixed(2),
              p95FrameTimeMs: +p95.toFixed(2),
              p99FrameTimeMs: +p99.toFixed(2),
              estimatedFps: fps,
              sampleCount: frameTimes.length
            });
          }
        }
        requestAnimationFrame(frame);
      });
    });

    worldData.frameTimeTelemetry = perfTelemetry;
    log(`  ⚡ Frame Time: Avg ${perfTelemetry.avgFrameTimeMs}ms | P95 ${perfTelemetry.p95FrameTimeMs}ms | P99 ${perfTelemetry.p99FrameTimeMs}ms (FPS ~${perfTelemetry.estimatedFps})`);
    log(`  📊 Render (Z=1000m): ${midStats.drawCalls} draw calls, ${midStats.triangles} tris, ${sceneAuditMid.totalMeshes} meshes`);

    fullAuditReport.worlds[w.id] = worldData;
  }

  // Save full audit telemetry JSON
  const telemetryPath = path.join(ARTIFACTS_DIR, 'audit_telemetry.json');
  fs.writeFileSync(telemetryPath, JSON.stringify(fullAuditReport, null, 2), 'utf-8');
  log(`\n✅ Full Audit Telemetry successfully saved to ${telemetryPath}`);

  await browser.close();
  log('🎉 Audit execution completed successfully.');
}

runBlockbusterWorldQualityAudit().catch((err) => {
  console.error('[Phase 11 Audit ERROR]', err);
  process.exit(1);
});
