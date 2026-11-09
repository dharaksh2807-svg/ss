import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase14', 'baseline');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 14 Baseline] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved: ${filename}`);
}

const ALL_WORLDS = [
  // Tier A: Legacy Free Worlds
  { id: 'MODERN_METRO', name: 'Modern Metro', tier: 'A', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Railway Quarter', tier: 'A', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Vaults', tier: 'A', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial Yard', tier: 'A', charId: 'char_jax', skinId: 'jax_classic' },

  // Tier B: Mid-Quality Premium Worlds
  { id: 'NEON_RAINLINE', name: 'Neon Rainline Cyberpunk', tier: 'B', charId: 'char_luna', skinId: 'luna_classic' },
  { id: 'ORBITAL_HALO', name: 'Orbital Halo Space Ring', tier: 'B', charId: 'char_nova', skinId: 'nova_classic' },
  { id: 'ABYSSAL_GLASSLINE', name: 'Abyssal Glassline Deep Sea', tier: 'B', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'DOOMSDAY_LAST_TRANSIT', name: 'Doomsday Wasteland', tier: 'B', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'PHANTOM_LINE', name: 'Phantom Line Ghost Metro', tier: 'B', charId: 'char_luna', skinId: 'luna_classic' },

  // Tier C: High-Quality Worlds Requiring Technical Polish
  { id: 'HAUNTED_CARNIVAL', name: 'Haunted Carnival Fairgrounds', tier: 'C', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet Art Deco', tier: 'C', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom Clockwork', tier: 'C', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Volcanic Bridge', tier: 'C', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush Caldera', tier: 'C', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'VIP_EXPRESS', name: 'Mitron Express 2.0', tier: 'C', charId: 'char_modi', skinId: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: Never-Ending', tier: 'C', charId: 'char_rahul_gandhi', skinId: 'rahul_classic' },
  { id: 'VIVA_HEAT', name: 'Viva Heat Street Carnival', tier: 'C', charId: 'char_jax', skinId: 'jax_classic' }
];

async function runBaselineAudit() {
  log('======================================================================');
  log('📊 STEP 1: PHASE 14 POST-PHASE 13 GLOBAL RE-BASELINE AUDIT');
  log('   Auditing all 17 Worlds for Draw Calls, Triangles, Frame Times, Memory');
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

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const report = {
    timestamp: new Date().toISOString(),
    engine: 'Three.js / WebGL / Vite',
    worlds: {}
  };

  for (const w of ALL_WORLDS) {
    log(`----------------------------------------------------------------------`);
    log(`▶ Re-Baselining [${w.id}] (${w.tier}) - ${w.name}`);
    log(`----------------------------------------------------------------------`);

    const worldMetrics = await page.evaluate(async ({ target }) => {
      const game = window.__METRO_GAME__;
      const gm = window.__GRAPHICS_MANAGER__ || (await import('/src/scene/GraphicsManager.ts')).GraphicsManager.getInstance();

      // Ensure unlocked
      game.progression.unlockCharacter(target.charId);
      game.progression.equipCharacter(target.charId, target.skinId);
      game.player.applyCharacter(target.charId, target.skinId);
      game.progression.addCoins(100000);
      game.progression.purchaseTheme(target.id);
      game.progression.equipTheme(target.id);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(target.id);

      const measureAt = (targetZ, preset = 'HIGH', seed = 1337) => {
        gm.setPreset(preset, true);
        game.worldScene.applyEnvironment(theme);
        game.trackManager.setDebugSeed(seed);
        game.trackManager.reset(false);
        game.startRun('NORMAL', false);
        game.cameraController.setLobbyMode(false);
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) game.openingSequence.skip();

        game.player.distanceTraveled = targetZ;
        game.player.position.set(0, game.player.groundY, -targetZ);
        game.player.speed = 22.0;

        const chunkStart = performance.now();
        for (let s = 0; s < 30; s++) {
          game.trackManager.update(game.player, 0.05, s * 0.05);
          game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
          game.worldScene.updateAtmosphere(0.05);
        }
        const chunkConstructionMs = performance.now() - chunkStart;

        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        const info = game.worldScene.renderer.info;
        let totalMeshes = 0;
        let instancedMeshes = 0;
        let totalInstances = 0;
        game.worldScene.scene.traverse((obj) => {
          if (obj.isMesh) {
            totalMeshes++;
            if (obj.isInstancedMesh) {
              instancedMeshes++;
              totalInstances += obj.count;
            }
          }
        });

        return {
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
          totalMeshes,
          instancedMeshes,
          totalInstances,
          chunkConstructionMs: Number(chunkConstructionMs.toFixed(2))
        };
      };

      // Measure HIGH at Z=1000m
      const high1000 = measureAt(1000, 'HIGH', 1337);

      // Measure frame times across 120 consecutive frames at Z=1000m
      const frameTimes = [];
      for (let f = 0; f < 120; f++) {
        const t0 = performance.now();
        game.trackManager.update(game.player, 0.016, f * 0.016);
        game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
        game.worldScene.updateAtmosphere(0.016);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
        const t1 = performance.now();
        frameTimes.push(t1 - t0);
      }
      frameTimes.sort((a, b) => a - b);
      const avgFrameTime = Number((frameTimes.reduce((acc, v) => acc + v, 0) / frameTimes.length).toFixed(2));
      const p95FrameTime = Number(frameTimes[Math.floor(frameTimes.length * 0.95)].toFixed(2));
      const p99FrameTime = Number(frameTimes[Math.floor(frameTimes.length * 0.99)].toFixed(2));

      // Measure LOW at Z=1000m
      const low1000 = measureAt(1000, 'LOW', 1337);

      // Measure HIGH at Z=50m
      const high50 = measureAt(50, 'HIGH', 1337);

      // Measure HIGH at Z=2200m
      const high2200 = measureAt(2200, 'HIGH', 1337);

      return {
        high1000,
        low1000,
        high50,
        high2200,
        avgFrameTime,
        p95FrameTime,
        p99FrameTime,
        fpsEst: Number((1000 / (avgFrameTime || 16.6)).toFixed(1))
      };
    }, { target: w });

    // Capture screenshots for HIGH at Z=1000m and LOW at Z=1000m
    const highFilename = `${w.id.toLowerCase()}_baseline_z1000_high.png`;
    await saveScreenshot(page, highFilename);

    report.worlds[w.id] = {
      ...w,
      ...worldMetrics,
      highScreenshot: highFilename
    };

    log(`  HIGH @ 1000m: Calls: ${worldMetrics.high1000.drawCalls} | Tris: ${worldMetrics.high1000.triangles.toLocaleString()} | Meshes: ${worldMetrics.high1000.totalMeshes} | FrameTime: ${worldMetrics.avgFrameTime}ms (P95: ${worldMetrics.p95FrameTime}ms)`);
    log(`  LOW  @ 1000m: Calls: ${worldMetrics.low1000.drawCalls} | Tris: ${worldMetrics.low1000.triangles.toLocaleString()} | Tris Δ: ${(((worldMetrics.low1000.triangles - worldMetrics.high1000.triangles) / worldMetrics.high1000.triangles) * 100).toFixed(1)}%`);
  }

  // Also test 3 cycles of world switching to verify memory stability
  log('\nTesting 3 cycles of world switching to measure memory stability...');
  const memTrends = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    const sequence = ['MODERN_METRO', 'VIP_EXPRESS', 'JURASSIC_RUSH', 'MODERN_METRO', 'INFERNO_EXPRESS', 'MODERN_METRO'];
    const readings = [];

    for (const id of sequence) {
      const theme = registry.get(id);
      game.worldScene.applyEnvironment(theme);
      game.trackManager.reset(false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
      const info = game.worldScene.renderer.info;
      readings.push({
        world: id,
        geometries: info.memory.geometries,
        textures: info.memory.textures
      });
    }
    return readings;
  });

  report.memoryCyclingTrends = memTrends;
  log(`Memory cycling start: ${memTrends[0].geometries} geoms, ${memTrends[0].textures} textures -> end: ${memTrends[memTrends.length - 1].geometries} geoms, ${memTrends[memTrends.length - 1].textures} textures`);

  const reportPath = path.join(ARTIFACTS_DIR, 'phase14_baseline_telemetry.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n✅ Saved comprehensive baseline telemetry to ${reportPath}`);

  await browser.close();
}

runBaselineAudit().catch((err) => {
  console.error('Phase 14 baseline audit failed:', err);
  process.exit(1);
});
