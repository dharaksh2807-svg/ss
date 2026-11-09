import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase13');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 13 Wave A Audit] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved screenshot: ${filename}`);
}

async function runWaveAAudit() {
  log('======================================================================');
  log('🏰 PHASE 13: WAVE A HIGH-IMPACT FANTASY SPECTACLE AUDIT');
  log('   Worlds: Chrono Kingdom, Inferno Express, Haunted Carnival, Phantom Line');
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
    wave: 'WAVE_A',
    worlds: {
      CHRONO_KINGDOM: {},
      INFERNO_EXPRESS: {},
      HAUNTED_CARNIVAL: {},
      PHANTOM_LINE: {}
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
  // 1. CHRONO KINGDOM
  // ==========================================
  log('▶ 1. CHRONO KINGDOM: Capturing The Great Clockwork Awakening (Z = 200m)...');
  const chronoAwakening = await setupWorldAtZ('CHRONO_KINGDOM', 200, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_chrono_kingdom_awakening.png');
  report.worlds.CHRONO_KINGDOM.awakening = chronoAwakening;

  log('▶ 2. CHRONO KINGDOM: Capturing The Time Fracture (Z = 550m)...');
  const chronoFracture = await setupWorldAtZ('CHRONO_KINGDOM', 550, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_chrono_kingdom_time_fracture.png');
  report.worlds.CHRONO_KINGDOM.timeFracture = chronoFracture;

  log('▶ 3. CHRONO KINGDOM: Verifying LOW preset retention...');
  const chronoLow = await setupWorldAtZ('CHRONO_KINGDOM', 200, 'LOW', 1337);
  await saveScreenshot(page, 'wave_a_chrono_kingdom_low_preset.png');
  report.worlds.CHRONO_KINGDOM.lowPreset = chronoLow;

  // ==========================================
  // 2. INFERNO EXPRESS
  // ==========================================
  log('▶ 4. INFERNO EXPRESS: Capturing Stratovolcano Eruption (Z = 120m)...');
  const infernoVolcano = await setupWorldAtZ('INFERNO_EXPRESS', 120, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_inferno_express_volcano_eruption.png');
  report.worlds.INFERNO_EXPRESS.volcanoEruption = infernoVolcano;

  log('▶ 5. INFERNO EXPRESS: Capturing Obsidian Citadel Gate (Z = 450m)...');
  const infernoCitadel = await setupWorldAtZ('INFERNO_EXPRESS', 450, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_inferno_express_obsidian_citadel.png');
  report.worlds.INFERNO_EXPRESS.obsidianCitadel = infernoCitadel;

  // ==========================================
  // 3. HAUNTED CARNIVAL
  // ==========================================
  log('▶ 6. HAUNTED CARNIVAL: Capturing Cursed Ferris Wheel Awakening (Z = 180m)...');
  const carnivalWheel = await setupWorldAtZ('HAUNTED_CARNIVAL', 180, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_haunted_carnival_ferris_wheel.png');
  report.worlds.HAUNTED_CARNIVAL.ferrisWheel = carnivalWheel;

  log('▶ 7. HAUNTED CARNIVAL: Capturing The Ghost Parade Procession (Z = 350m)...');
  const carnivalParade = await setupWorldAtZ('HAUNTED_CARNIVAL', 350, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_haunted_carnival_ghost_parade.png');
  report.worlds.HAUNTED_CARNIVAL.ghostParade = carnivalParade;

  // ==========================================
  // 4. PHANTOM LINE
  // ==========================================
  log('▶ 8. PHANTOM LINE: Capturing Spectral Train Passing on Isolated Track (Z = 220m)...');
  const phantomTrain = await setupWorldAtZ('PHANTOM_LINE', 220, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_phantom_line_spectral_train.png');
  report.worlds.PHANTOM_LINE.spectralTrain = phantomTrain;

  log('▶ 9. PHANTOM LINE: Capturing The Haunted Platform Station (Z = 600m)...');
  const phantomPlatform = await setupWorldAtZ('PHANTOM_LINE', 600, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_phantom_line_haunted_platform.png');
  report.worlds.PHANTOM_LINE.hauntedPlatform = phantomPlatform;

  // ==========================================
  // 5. MOBILE VIEWPORT CHECK (390 x 844)
  // ==========================================
  log('▶ 10. Mobile Viewport Check (390 x 844 portrait)...');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAudit = await setupWorldAtZ('CHRONO_KINGDOM', 200, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_a_mobile_chrono_kingdom.png');
  report.mobileViewport = mobileAudit;

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ==========================================
  // 6. FRAME TIME & PERFORMANCE MEASUREMENT
  // ==========================================
  log('▶ 11. Measuring 120-frame runtime performance across Chrono Kingdom...');
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
  const reportPath = path.join(ARTIFACTS_DIR, 'wave_a_telemetry.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log(`\n✅ Saved telemetry report to ${reportPath}`);

  await browser.close();
  log('🎉 Wave A audit complete!');
}

runWaveAAudit().catch((err) => {
  console.error('Wave A audit failed:', err);
  process.exit(1);
});
