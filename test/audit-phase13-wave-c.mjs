import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase13');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 13 Wave C Audit] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved screenshot: ${filename}`);
}

async function runWaveCAudit() {
  log('======================================================================');
  log('🚀 PHASE 13: WAVE C SCI-FI & DISASTER SPECTACLE AUDIT');
  log('   Worlds: Orbital Halo, Abyssal Glassline, Neon Rainline, Doomsday');
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

  const report = {
    timestamp: new Date().toISOString(),
    wave: 'WAVE_C',
    worlds: {
      ORBITAL_HALO: {},
      ABYSSAL_GLASSLINE: {},
      NEON_RAINLINE: {},
      DOOMSDAY_LAST_TRANSIT: {}
    },
    performanceSummary: {}
  };

  const setupWorldAtZ = async (themeKey, targetZ, preset = 'HIGH', seed = 1337) => {
    return await page.evaluate(async ({ themeKey, targetZ, preset, seed }) => {
      const game = window.__METRO_GAME__;
      const gm = window.__GRAPHICS_MANAGER__ || (await import('/src/scene/GraphicsManager.ts')).GraphicsManager.getInstance();

      gm.setPreset(preset, true);

      // Add coins & unlock theme
      game.progression.addCoins(100000);
      game.progression.purchaseTheme(themeKey);
      game.progression.equipTheme(themeKey);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(themeKey);
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

      for (let s = 0; s < 35; s++) {
        game.trackManager.update(game.player, 0.05, s * 0.05);
        game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
        game.worldScene.updateAtmosphere(0.05);
      }

      game.cameraController.reset(game.player.position);
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

      const rendererInfo = game.worldScene.renderer.info;
      return {
        themeKey,
        playerZ: game.player.position.z,
        drawCalls: rendererInfo.render.calls,
        triangles: rendererInfo.render.triangles,
        geometries: rendererInfo.memory.geometries,
        textures: rendererInfo.memory.textures
      };
    }, { themeKey, targetZ, preset, seed });
  };

  // ==========================================
  // 1. ORBITAL HALO
  // ==========================================
  log('▶ 1. ORBITAL HALO: Capturing Planetary Eclipse / Alignment (Z = 160m)...');
  const haloEclipse = await setupWorldAtZ('ORBITAL_HALO', 160, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_orbital_halo_planetary_eclipse.png');
  report.worlds.ORBITAL_HALO.planetaryEclipse = haloEclipse;

  log('▶ 2. ORBITAL HALO: Capturing Orbital Ring Awakening / Solar Array (Z = 450m)...');
  const haloRing = await setupWorldAtZ('ORBITAL_HALO', 450, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_orbital_halo_station_transformation.png');
  report.worlds.ORBITAL_HALO.stationTransformation = haloRing;

  log('▶ 3. ORBITAL HALO: Verifying LOW preset retention...');
  const haloLow = await setupWorldAtZ('ORBITAL_HALO', 160, 'LOW', 1337);
  await saveScreenshot(page, 'wave_c_orbital_halo_low_preset.png');
  report.worlds.ORBITAL_HALO.lowPreset = haloLow;

  // ==========================================
  // 2. ABYSSAL GLASSLINE
  // ==========================================
  log('▶ 4. ABYSSAL GLASSLINE: Capturing Deep-Sea Leviathan Passage (Z = 320m)...');
  const abyssalLeviathan = await setupWorldAtZ('ABYSSAL_GLASSLINE', 320, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_abyssal_glassline_leviathan_passage.png');
  report.worlds.ABYSSAL_GLASSLINE.leviathanPassage = abyssalLeviathan;

  log('▶ 5. ABYSSAL GLASSLINE: Capturing Oceanic Research City Illumination (Z = 550m)...');
  const abyssalCity = await setupWorldAtZ('ABYSSAL_GLASSLINE', 550, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_abyssal_glassline_city_illumination.png');
  report.worlds.ABYSSAL_GLASSLINE.cityIllumination = abyssalCity;

  // ==========================================
  // 3. NEON RAINLINE
  // ==========================================
  log('▶ 6. NEON RAINLINE: Capturing Neon City / Plaza Awakening (Z = 200m)...');
  const neonAwakening = await setupWorldAtZ('NEON_RAINLINE', 200, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_neon_rainline_city_awakening.png');
  report.worlds.NEON_RAINLINE.cityAwakening = neonAwakening;

  log('▶ 7. NEON RAINLINE: Capturing Holographic Skyline & Air-Traffic (Z = 480m)...');
  const neonSkyline = await setupWorldAtZ('NEON_RAINLINE', 480, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_neon_rainline_skyline_cascade.png');
  report.worlds.NEON_RAINLINE.skylineCascade = neonSkyline;

  // ==========================================
  // 4. DOOMSDAY: LAST TRANSIT
  // ==========================================
  log('▶ 8. DOOMSDAY: Capturing Distant Skyline Skyscraper Collapse (Z = 240m)...');
  const doomsdayCollapse = await setupWorldAtZ('DOOMSDAY_LAST_TRANSIT', 240, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_doomsday_skyline_collapse.png');
  report.worlds.DOOMSDAY_LAST_TRANSIT.skylineCollapse = doomsdayCollapse;

  log('▶ 9. DOOMSDAY: Capturing Last Evacuation Convoy & Rescue Train (Z = 600m)...');
  const doomsdayConvoy = await setupWorldAtZ('DOOMSDAY_LAST_TRANSIT', 600, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_doomsday_evacuation_convoy.png');
  report.worlds.DOOMSDAY_LAST_TRANSIT.evacuationConvoy = doomsdayConvoy;

  // ==========================================
  // 5. MOBILE VIEWPORT CHECK (390 x 844)
  // ==========================================
  log('▶ 10. Mobile Viewport Check (390 x 844 portrait on Orbital Halo)...');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAudit = await setupWorldAtZ('ORBITAL_HALO', 160, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_c_mobile_orbital_halo.png');
  report.mobileViewport = mobileAudit;

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ==========================================
  // 6. FRAME TIME & PERFORMANCE MEASUREMENT
  // ==========================================
  log('▶ 11. Measuring 120-frame runtime performance across Doomsday Last Transit...');
  const perfStats = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const samples = [];
    for (let f = 0; f < 120; f++) {
      const t0 = performance.now();
      game.player.position.z -= 0.36; // ~22m/s at 60fps
      game.trackManager.update(game.player, 0.0166, f * 0.0166);
      game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
      game.worldScene.updateAtmosphere(0.0166);
      game.cameraController.update(0.0166, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
      const dt = performance.now() - t0;
      samples.push(dt);
    }
    samples.sort((a, b) => a - b);
    const avg = samples.reduce((s, x) => s + x, 0) / samples.length;
    const p95 = samples[Math.floor(samples.length * 0.95)];
    const p99 = samples[Math.floor(samples.length * 0.99)];
    const max = samples[samples.length - 1];
    return {
      frames: samples.length,
      avgMs: Number(avg.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
      maxMs: Number(max.toFixed(2)),
      estimatedFps: Number((1000 / avg).toFixed(1))
    };
  });
  report.performanceSummary = perfStats;
  log(`  Avg Frame: ${perfStats.avgMs} ms | P95: ${perfStats.p95Ms} ms | Est FPS: ${perfStats.estimatedFps}`);

  // Write JSON report
  const reportPath = path.join(ARTIFACTS_DIR, 'wave_c_telemetry.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log(`\n✅ Saved telemetry report to ${reportPath}`);

  await browser.close();
  log('🎉 Wave C audit complete!');
}

runWaveCAudit().catch((err) => {
  console.error('Wave C audit failed:', err);
  process.exit(1);
});
