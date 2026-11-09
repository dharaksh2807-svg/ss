import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase13');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 13 Wave B Audit] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved screenshot: ${filename}`);
}

async function runWaveBAudit() {
  log('======================================================================');
  log('🎭 PHASE 13: WAVE B CHARACTER & SOCIAL SPECTACLE AUDIT');
  log('   Worlds: VIP Express, Rahulverse, Midnight Velvet, Viva Heat');
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
    wave: 'WAVE_B',
    worlds: {
      VIP_EXPRESS: {},
      RAHULVERSE: {},
      MIDNIGHT_VELVET: {},
      VIVA_HEAT: {}
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
  // 1. VIP EXPRESS (Mitron Express)
  // ==========================================
  log('▶ 1. VIP EXPRESS: Capturing Political Roadshow Chaos (Z = 200m)...');
  const vipRoadshow = await setupWorldAtZ('VIP_EXPRESS', 200, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_vip_express_roadshow_chaos.png');
  report.worlds.VIP_EXPRESS.roadshowChaos = vipRoadshow;

  log('▶ 2. VIP EXPRESS: Capturing Inauguration Inception (Z = 450m)...');
  const vipInauguration = await setupWorldAtZ('VIP_EXPRESS', 450, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_vip_express_inauguration_inception.png');
  report.worlds.VIP_EXPRESS.inaugurationInception = vipInauguration;

  log('▶ 3. VIP EXPRESS: Verifying LOW preset retention...');
  const vipLow = await setupWorldAtZ('VIP_EXPRESS', 200, 'LOW', 1337);
  await saveScreenshot(page, 'wave_b_vip_express_low_preset.png');
  report.worlds.VIP_EXPRESS.lowPreset = vipLow;

  // ==========================================
  // 2. RAHULVERSE
  // ==========================================
  log('▶ 4. RAHULVERSE: Capturing The Infinite Yatra Finish Flip (Z = 150m)...');
  const rahulYatra = await setupWorldAtZ('RAHULVERSE', 150, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_rahulverse_infinite_yatra.png');
  report.worlds.RAHULVERSE.infiniteYatra = rahulYatra;

  log('▶ 5. RAHULVERSE: Capturing Parliamentary Cartoon Chaos (Z = 350m)...');
  const rahulParliament = await setupWorldAtZ('RAHULVERSE', 350, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_rahulverse_parliament_chaos.png');
  report.worlds.RAHULVERSE.parliamentChaos = rahulParliament;

  // ==========================================
  // 3. MIDNIGHT VELVET
  // ==========================================
  log('▶ 6. MIDNIGHT VELVET: Capturing Grand Nightlife Reveal (Z = 220m)...');
  const velvetReveal = await setupWorldAtZ('MIDNIGHT_VELVET', 220, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_midnight_velvet_nightlife_reveal.png');
  report.worlds.MIDNIGHT_VELVET.nightlifeReveal = velvetReveal;

  log('▶ 7. MIDNIGHT VELVET: Capturing Celebrity Fashion Arrival (Z = 480m)...');
  const velvetArrival = await setupWorldAtZ('MIDNIGHT_VELVET', 480, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_midnight_velvet_celebrity_arrival.png');
  report.worlds.MIDNIGHT_VELVET.celebrityArrival = velvetArrival;

  // ==========================================
  // 4. VIVA HEAT
  // ==========================================
  log('▶ 8. VIVA HEAT: Capturing Tropical Festival Procession (Z = 200m)...');
  const vivaProcession = await setupWorldAtZ('VIVA_HEAT', 200, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_viva_heat_festival_procession.png');
  report.worlds.VIVA_HEAT.festivalProcession = vivaProcession;

  log('▶ 9. VIVA HEAT: Capturing Grand Stage Finale Concert (Z = 500m)...');
  const vivaFinale = await setupWorldAtZ('VIVA_HEAT', 500, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_viva_heat_grand_stage_finale.png');
  report.worlds.VIVA_HEAT.grandStageFinale = vivaFinale;

  // ==========================================
  // 5. MOBILE VIEWPORT CHECK (390 x 844)
  // ==========================================
  log('▶ 10. Mobile Viewport Check (390 x 844 portrait on Midnight Velvet)...');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAudit = await setupWorldAtZ('MIDNIGHT_VELVET', 220, 'HIGH', 1337);
  await saveScreenshot(page, 'wave_b_mobile_midnight_velvet.png');
  report.mobileViewport = mobileAudit;

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ==========================================
  // 6. FRAME TIME & PERFORMANCE MEASUREMENT
  // ==========================================
  log('▶ 11. Measuring 120-frame runtime performance across Viva Heat...');
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
  const reportPath = path.join(ARTIFACTS_DIR, 'wave_b_telemetry.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log(`\n✅ Saved telemetry report to ${reportPath}`);

  await browser.close();
  log('🎉 Wave B audit complete!');
}

runWaveBAudit().catch((err) => {
  console.error('Wave B audit failed:', err);
  process.exit(1);
});
